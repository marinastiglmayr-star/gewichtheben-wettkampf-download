"use strict";

const AUTH_KEY = "gewichtheben-waage";

let auth = loadAuth();
let state = null;
let eventSource = null;
let heartbeatTimer = null;

const $ = (selector) => document.querySelector(selector);
const els = {};

document.addEventListener("DOMContentLoaded", async () => {
  Object.assign(els, {
    loginPanel: $("#login-panel"),
    weighPanel: $("#weigh-panel"),
    loginForm: $("#login-form"),
    code: $("#code"),
    logout: $("#logout"),
    weighForm: $("#weigh-form"),
    groupFilter: $("#group-filter"),
    athlete: $("#athlete"),
    bodyweight: $("#bodyweight"),
    snatch: $("#snatch"),
    cleanJerk: $("#clean-jerk"),
    athleteSummary: $("#athlete-summary"),
    prevAthlete: $("#prev-athlete"),
    nextAthlete: $("#next-athlete"),
    markMissing: $("#mark-missing"),
    status: $("#status"),
    modeNote: $("#mode-note"),
  });

  els.loginForm.addEventListener("submit", register);
  els.logout.addEventListener("click", logout);
  els.weighForm.addEventListener("submit", saveWeighData);
  els.groupFilter.addEventListener("change", () => {
    renderAthleteOptions();
    loadSelectedAthlete();
  });
  els.athlete.addEventListener("change", loadSelectedAthlete);
  els.prevAthlete.addEventListener("click", () => moveSelection(-1));
  els.nextAthlete.addEventListener("click", () => moveSelection(1));
  els.markMissing.addEventListener("click", toggleMissing);

  await loadState();
  startEvents();
  startHeartbeat();
  window.addEventListener("beforeunload", () => {
    if (!auth?.token || !navigator.sendBeacon) return;
    navigator.sendBeacon(
      "/api/weigh/logout",
      new Blob([JSON.stringify({ token: auth.token })], { type: "application/json" }),
    );
  });
  render();
});

async function register(event) {
  event.preventDefault();
  const response = await fetch("/api/weigh/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: els.code.value.trim(),
      token: auth?.token || null,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    setStatus(result.error || "Verbindung nicht moeglich.");
    return;
  }
  auth = { token: result.token, name: result.name || "Waage" };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  startHeartbeat();
  render();
}

async function logout() {
  if (auth?.token) {
    await fetch("/api/weigh/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: auth.token }),
    }).catch(() => {});
  }
  localStorage.removeItem(AUTH_KEY);
  auth = null;
  render();
}

async function saveWeighData(event) {
  event.preventDefault();
  if (!auth?.token || !els.athlete.value) return;
  const athlete = findAthlete(els.athlete.value);
  if (!canEditWeighData(athlete)) {
    setStatus("Waagedaten koennen nur in der Vorbereitung geaendert werden.");
    return;
  }
  const response = await fetch("/api/weigh/athlete-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: auth.token,
      athleteId: els.athlete.value,
      bodyweight: els.bodyweight.value,
      snatch: els.snatch.value,
      cleanJerk: els.cleanJerk.value,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    setStatus(result.error || "Waagedaten konnten nicht gespeichert werden.");
    return;
  }
  if (result.state) state = normalizeState(result.state);
  setStatus("Waagedaten gespeichert.");
  render();
}

async function toggleMissing() {
  if (!auth?.token || !els.athlete.value) return;
  const athlete = findAthlete(els.athlete.value);
  if (!canToggleMissing(athlete)) {
    setStatus(missingDisabledReason(athlete));
    return;
  }
  const nextMissing = !athlete.withdrawn;
  const response = await fetch("/api/weigh/athlete-missing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: auth.token,
      athleteId: athlete.id,
      missing: nextMissing,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    setStatus(result.error || "Status konnte nicht gespeichert werden.");
    return;
  }
  if (result.state) state = normalizeState(result.state);
  setStatus(nextMissing ? "Athlet als fehlend markiert." : "Fehlend-Markierung entfernt.");
  render();
}

async function loadState() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (response.ok) state = normalizeState(await response.json());
  } catch (error) {
    setStatus("Keine Verbindung zum PC.");
  }
}

function startEvents() {
  if (eventSource) return;
  eventSource = new EventSource("/api/events");
  eventSource.addEventListener("state", (event) => {
    if (isEditingWeighInput()) return;
    state = normalizeState(JSON.parse(event.data));
    render();
  });
  eventSource.addEventListener("error", () => {
    setStatus("Live-Verbindung wird wiederhergestellt.");
  });
}

function startHeartbeat() {
  if (!auth?.token || heartbeatTimer) return;
  sendHeartbeat();
  heartbeatTimer = setInterval(sendHeartbeat, 5000);
}

async function sendHeartbeat() {
  if (!auth?.token) return;
  try {
    const response = await fetch("/api/weigh/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: auth.token }),
    });
    if (response.status === 401) {
      localStorage.removeItem(AUTH_KEY);
      auth = null;
      render();
    }
  } catch (error) {
    setStatus("Verbindung wird wiederhergestellt.");
  }
}

function render() {
  document.body.classList.toggle("iwf-mode", state?.meta?.scoringMode === "IWF");
  els.modeNote.textContent = state?.meta?.mode === "setup" ? "Vorbereitung" : "Wettkampf laeuft";
  const isLoggedIn = Boolean(auth?.token);
  els.loginPanel.classList.toggle("hidden", isLoggedIn);
  els.weighPanel.classList.toggle("hidden", !isLoggedIn);
  if (!isLoggedIn) return;
  renderGroupFilter();
  renderAthleteOptions();
  loadSelectedAthlete();
  updateFormAvailability();
}

function renderGroupFilter() {
  const selected = els.groupFilter.value || "all";
  const groups = getOrderedGroups();
  els.groupFilter.innerHTML = [
    `<option value="all">Alle Gruppen</option>`,
    ...groups.map((group) => `<option value="${escapeHtml(group.id)}">Gruppe ${escapeHtml(group.name)}</option>`),
  ].join("");
  els.groupFilter.value = selected === "all" || groups.some((group) => group.id === selected) ? selected : "all";
}

function getFilteredAthletes() {
  const groupId = els.groupFilter.value || "all";
  return (state?.athletes || []).filter((athlete) => groupId === "all" || getAthleteGroupId(athlete) === groupId);
}

function renderAthleteOptions() {
  const selected = els.athlete.value;
  const athletes = getFilteredAthletes();
  els.athlete.innerHTML = athletes
    .map((athlete, index) => {
      const suffix = athlete.withdrawn ? " - fehlend" : "";
      return `<option value="${escapeHtml(athlete.id)}">${index + 1}. ${escapeHtml(athlete.name)}${suffix}</option>`;
    })
    .join("");
  Array.from(els.athlete.options).forEach((option) => {
    const athlete = findAthlete(option.value);
    const status = athlete ? weighStatus(athlete) : "empty";
    option.className = `weigh-status-${status}`;
  });
  els.athlete.value = athletes.some((athlete) => athlete.id === selected) ? selected : athletes[0]?.id || "";
}

function loadSelectedAthlete() {
  const athlete = findAthlete(els.athlete.value);
  if (!athlete) {
    els.bodyweight.value = "";
    els.snatch.value = "";
    els.cleanJerk.value = "";
    els.athleteSummary.innerHTML = `<p class="muted">Kein Athlet ausgewaehlt.</p>`;
    return;
  }
  if (document.activeElement !== els.bodyweight) els.bodyweight.value = athlete.bodyweight || "";
  if (document.activeElement !== els.snatch) els.snatch.value = athlete.openers?.snatch || "";
  if (document.activeElement !== els.cleanJerk) els.cleanJerk.value = athlete.openers?.cleanJerk || "";
  els.athleteSummary.innerHTML = `
    <div><span>Name</span><strong>${escapeHtml(athlete.name)}</strong></div>
    <div><span>Gruppe</span><strong>${escapeHtml(groupNameById(athlete.groupId))}</strong></div>
    <div><span>Verein</span><strong>${escapeHtml(athlete.team || "-")}</strong></div>
    <div><span>Status</span><strong>${athlete.withdrawn ? "fehlend" : "anwesend"}</strong></div>
  `;
  updateFormAvailability();
}

function moveSelection(direction) {
  const athletes = getFilteredAthletes();
  const index = athletes.findIndex((athlete) => athlete.id === els.athlete.value);
  if (index < 0) return;
  const next = athletes[index + direction];
  if (!next) return;
  els.athlete.value = next.id;
  loadSelectedAthlete();
}

function updateFormAvailability() {
  const athlete = findAthlete(els.athlete.value);
  const dataDisabled = !canEditWeighData(athlete);
  [els.bodyweight, els.snatch, els.cleanJerk].forEach((control) => {
    control.disabled = dataDisabled;
  });
  const saveButton = els.weighForm.querySelector("button[type='submit']");
  if (saveButton) saveButton.disabled = dataDisabled;
  els.groupFilter.disabled = false;
  els.athlete.disabled = false;
  els.prevAthlete.disabled = false;
  els.nextAthlete.disabled = false;
  els.markMissing.disabled = !canToggleMissing(athlete);
  els.markMissing.textContent = athlete?.withdrawn ? "Fehlend zuruecknehmen" : "Als fehlend markieren";
  if (!athlete) setStatus("Kein Athlet ausgewaehlt.");
  else if (dataDisabled && state?.meta?.mode !== "setup") setStatus("Waagedaten sind im laufenden Wettkampf gesperrt. Fehlend-Markierung bleibt fuer spaetere Gruppen moeglich.");
  else if (athlete.withdrawn) setStatus("Athlet ist als fehlend markiert.");
  else setStatus("Bereit.");
}

function canEditWeighData(athlete) {
  return Boolean(athlete) && !athlete.withdrawn && state?.meta?.mode === "setup";
}

function canToggleMissing(athlete) {
  if (!athlete) return false;
  if (hasAnyRecordedAttempt(athlete)) return false;
  if (state?.meta?.mode !== "setup" && state?.meta?.activeGroupId && getAthleteGroupId(athlete) === state.meta.activeGroupId) return false;
  return true;
}

function missingDisabledReason(athlete) {
  if (!athlete) return "Kein Athlet ausgewaehlt.";
  if (hasAnyRecordedAttempt(athlete)) return "Athlet hat bereits Versuche im Wettkampf.";
  if (state?.meta?.mode !== "setup" && state?.meta?.activeGroupId && getAthleteGroupId(athlete) === state.meta.activeGroupId) {
    return "Die aktuell laufende Gruppe kann an der Waage nicht als fehlend markiert werden.";
  }
  return "Status kann aktuell nicht geaendert werden.";
}

function weighStatus(athlete) {
  if (athlete.withdrawn) return "missing";
  const values = [athlete.bodyweight, athlete.openers?.snatch, athlete.openers?.cleanJerk];
  const filled = values.filter((value) => value !== null && value !== undefined && value !== "").length;
  if (filled === values.length) return "complete";
  if (filled > 0) return "partial";
  return "empty";
}

function getOrderedGroups() {
  return [...(state?.groups || [])].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return String(a.name).localeCompare(String(b.name), "de-DE", { numeric: true });
  });
}

function findAthlete(id) {
  return (state?.athletes || []).find((athlete) => athlete.id === id) || null;
}

function getAthleteGroupId(athlete) {
  return athlete?.groupId || getOrderedGroups()[0]?.id || null;
}

function groupNameById(id) {
  return getOrderedGroups().find((group) => group.id === id)?.name || "-";
}

function hasAnyRecordedAttempt(athlete) {
  return Boolean((athlete?.attempts?.snatch || []).length || (athlete?.attempts?.cleanJerk || []).length);
}

function isEditingWeighInput() {
  return Boolean(document.activeElement?.closest?.("#weigh-form"));
}

function normalizeState(input) {
  return {
    ...input,
    groups: Array.isArray(input?.groups) ? input.groups : [],
    athletes: Array.isArray(input?.athletes) ? input.athletes : [],
  };
}

function setStatus(message) {
  if (els.status) els.status.textContent = message;
}

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
