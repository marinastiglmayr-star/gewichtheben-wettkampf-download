"use strict";

const LIFTS = {
  snatch: { label: "Reißen", short: "R" },
  cleanJerk: { label: "Stoßen", short: "S" },
};

const ROLE_LABELS = {
  solo: "Kampfrichter",
  left: "Links",
  center: "Mitte",
  right: "Rechts",
};

const ROLE_INDEX = {
  solo: 0,
  left: 0,
  center: 1,
  right: 2,
};

const AUTH_KEY = "gewichtheben-kampfrichter";

let auth = loadAuth();
let state = null;
let eventSource = null;

const $ = (selector) => document.querySelector(selector);

const els = {};

document.addEventListener("DOMContentLoaded", async () => {
  Object.assign(els, {
    loginPanel: $("#login-panel"),
    votePanel: $("#vote-panel"),
    loginForm: $("#login-form"),
    code: $("#code"),
    judgeName: $("#judge-name"),
    role: $("#role"),
    roleField: $("#role-field"),
    roleLabel: $("#role-label"),
    judgeLabel: $("#judge-label"),
    judgeModeNote: $("#judge-mode-note"),
    loginModeNote: $("#login-mode-note"),
    logout: $("#logout"),
    attemptView: $("#attempt-view"),
    techniqueField: $("#technique-field"),
    techniquePoints: $("#technique-points"),
    headActions: $("#head-actions"),
    timerStart: $("#timer-start"),
    timerToggle: $("#timer-toggle"),
    status: $("#status"),
  });

  els.loginForm.addEventListener("submit", register);
  els.logout.addEventListener("click", logout);
  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-vote]");
    if (button) submitVote(button.dataset.vote);
    const actionButton = event.target.closest("[data-judge-action]");
    if (actionButton) submitJudgeAction(actionButton.dataset.judgeAction);
  });

  await loadState();
  startEvents();
  render();
});

async function register(event) {
  event.preventDefault();
  const refereeCount = getRefereeCount();
  const response = await fetch("/api/judges/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: els.code.value.trim(),
      name: els.judgeName.value.trim(),
      role: refereeCount === 1 ? "solo" : els.role.value,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    setStatus(result.error || "Verbindung nicht möglich.");
    return;
  }

  auth = result;
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  render();
}

async function logout() {
  if (auth?.token) {
    await fetch("/api/judges/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: auth.token }),
    }).catch(() => {});
  }
  localStorage.removeItem(AUTH_KEY);
  auth = null;
  render();
}

async function submitVote(vote) {
  if (!auth?.token) return;
  const current = getCurrentAttempt();
  if (!current) {
    setStatus("Kein aktueller Versuch.");
    return;
  }

  const response = await fetch("/api/judges/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: auth.token,
      key: attemptKey(current),
      vote,
      techniquePoints: readTechniquePoints(current),
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    setStatus(result.error || "Stimme konnte nicht gesendet werden.");
    return;
  }
  setStatus(vote === "good" ? "Weiß gesendet." : "Rot gesendet.");
}

async function submitJudgeAction(action) {
  if (action === "start-timer") {
    if (!auth?.token || !canControlAttempt()) return;
    const response = await fetch("/api/judges/start-timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: auth.token }),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error || "Zeit konnte nicht gestartet werden.");
      return;
    }
    setStatus("Zeit gestartet.");
    return;
  }
  if (action === "toggle-timer") {
    if (!auth?.token || !canControlAttempt()) return;
    const response = await fetch("/api/judges/toggle-timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: auth.token }),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error || "Zeit konnte nicht umgeschaltet werden.");
      return;
    }
    setStatus(result.timer?.paused ? "Zeit pausiert." : "Zeit läuft weiter.");
    return;
  }
  if (!auth?.token || !canControlAttempt()) return;
  const current = getCurrentAttempt();
  if (!current && action !== "clear") {
    setStatus("Kein aktueller Versuch.");
    return;
  }

  const response = await fetch(action === "clear" ? "/api/judges/clear-votes" : "/api/judges/record-attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: auth.token,
      key: current ? attemptKey(current) : state?.meta?.liveVotes?.key,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    setStatus(result.error || "Aktion konnte nicht ausgeführt werden.");
    return;
  }
  setStatus(action === "clear" ? "Wertung geleert." : "Versuch eingetragen.");
}

async function loadState() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (response.ok) state = await response.json();
  } catch (error) {
    setStatus("Keine Verbindung zum PC.");
  }
}

function startEvents() {
  if (eventSource) return;
  eventSource = new EventSource("/api/events");
  eventSource.addEventListener("state", (event) => {
    state = JSON.parse(event.data);
    render();
  });
  eventSource.addEventListener("error", () => {
    setStatus("Live-Verbindung wird wiederhergestellt.");
  });
}

function render() {
  const iwfMode = isIwfMode();
  document.body.classList.toggle("iwf-mode", iwfMode);
  renderModeNotes();
  if (iwfMode && auth?.role === "solo") {
    localStorage.removeItem(AUTH_KEY);
    auth = null;
    setStatus("IWF-Regeln aktiv: Bitte neu als Links, Mitte oder Rechts verbinden.");
  }
  const isLoggedIn = Boolean(auth?.token);
  els.loginPanel.classList.toggle("hidden", isLoggedIn);
  els.votePanel.classList.toggle("hidden", !isLoggedIn);
  els.roleField.classList.toggle("hidden", getRefereeCount() === 1);
  els.role.required = getRefereeCount() !== 1;

  if (!isLoggedIn) return;

  els.roleLabel.textContent = ROLE_LABELS[auth.role] || "Verbunden";
  els.judgeLabel.textContent = auth.name || "Kampfrichter";
  els.headActions.classList.toggle("hidden", !canControlAttempt());
  renderTimerAction();
  renderAttempt();
}

function isIwfMode() {
  return state?.meta?.scoringMode === "IWF";
}

function renderModeNotes() {
  const text = isIwfMode()
    ? "IWF-Regeln aktiv - 3 Kampfrichter, keine Technikpunkte."
    : "Vereinsmodus";
  if (els.judgeModeNote) els.judgeModeNote.textContent = text;
  if (els.loginModeNote) {
    els.loginModeNote.textContent = isIwfMode()
      ? "IWF-Regeln aktiv: Bitte eine der drei Positionen Links, Mitte oder Rechts auswählen."
      : "Im Vereinsmodus richtet sich die Auswahl nach der Wettkampfleitungs-App.";
  }
}

function renderTimerAction() {
  const current = getCurrentAttempt();
  const timer = state?.meta?.attemptTimer;
  const currentKey = current ? attemptKey(current) : "";
  const hasPreparedTimer = Boolean(timer?.seconds && timer.key === currentKey);
  const hasStartedTimer = Boolean(timer?.startedBy && timer?.startedAt && timer.seconds && timer.key === currentKey);
  const canControl = canControlAttempt();
  if (els.timerStart) {
    els.timerStart.disabled = !canControl || !hasPreparedTimer || hasStartedTimer;
  }
  if (els.timerToggle) {
    els.timerToggle.disabled = !canControl || !hasStartedTimer;
    els.timerToggle.textContent = timer?.paused ? "Zeit weiterlaufen lassen" : "Zeit pausieren";
  }
}

function renderAttempt() {
  const current = getCurrentAttempt();
  if (!current) {
    els.attemptView.innerHTML = `
      <p class="eyebrow">Warten</p>
      <h2>Kein Versuch aufgerufen</h2>
      <p>Die Hauptanzeige steuert den Wettkampf.</p>
    `;
    setButtons(undefined);
    renderTechniqueField(null);
    return;
  }

  const key = attemptKey(current);
  const vote = state?.meta?.liveVotes?.key === key ? state.meta.liveVotes.votes[ROLE_INDEX[auth.role]] : null;
  const techniquePoint =
    state?.meta?.liveTechnique?.key === key ? state.meta.liveTechnique.points[ROLE_INDEX[auth.role]] : null;
  els.attemptView.innerHTML = `
    <p class="eyebrow">${isIwfMode() ? "IWF-Wertung" : "Aktueller Versuch"}</p>
    <h2>${escapeHtml(current.athlete.name)}</h2>
    <div class="meta-row">
      <span>Gruppe ${escapeHtml(groupNameById(current.athlete.groupId))}</span>
      <span>${LIFTS[current.lift].label}</span>
      <span>Versuch ${current.attemptNo}</span>
    </div>
    <strong>${current.weight} kg</strong>
  `;
  renderTechniqueField(current, techniquePoint);
  setButtons(vote);
}

function renderTechniqueField(current, techniquePoint = null) {
  const show = Boolean(current && shouldUseTechnique(current.athlete));
  els.techniqueField.classList.toggle("hidden", !show);
  if (!show) {
    els.techniquePoints.value = "";
    return;
  }
  if (document.activeElement !== els.techniquePoints) {
    els.techniquePoints.value = techniquePoint === null || techniquePoint === undefined ? "" : techniquePoint;
  }
}

function setButtons(vote) {
  document.querySelectorAll("[data-vote]").forEach((button) => {
    button.disabled = vote === undefined;
    button.classList.toggle("active", (button.dataset.vote === "good") === vote);
  });
}

function setStatus(message) {
  if (els.status) els.status.textContent = message;
}

function getCurrentAttempt() {
  if (!state || state.meta?.mode !== "competition" || state.meta?.breakPending) return null;
  return getQueue(state.meta.activeLift)[0] || null;
}

function getRefereeCount() {
  return Number(state?.meta?.refereeCount) === 1 ? 1 : 3;
}

function canControlAttempt() {
  return auth?.role === "solo" || auth?.role === "center";
}

function shouldUseTechnique(athlete) {
  if (isIwfMode()) return false;
  return Boolean(state?.meta?.childTechniqueEnabled) && Boolean(getCategory(athlete?.gender).usesTechnique);
}

function readTechniquePoints(current) {
  if (!shouldUseTechnique(current?.athlete)) return null;
  const value = Number(els.techniquePoints.value);
  return Number.isFinite(value) ? value : null;
}

function normalizeGender(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const categories = Array.isArray(state?.categories) && state.categories.length ? state.categories : [];
  const direct = categories.find((category) => String(category.id).toLowerCase() === normalized);
  if (direct) return direct.id;
  const byLabel = categories.find((category) => String(category.label).trim().toLowerCase() === normalized);
  if (byLabel) return byLabel.id;
  if (normalized === "female" || normalized === "woman" || normalized === "w" || normalized === "frau") return "female";
  if (normalized === "child" || normalized === "kid" || normalized === "kind") return "child";
  return categories[0]?.id || "male";
}

function getCategory(value) {
  const categories = Array.isArray(state?.categories) && state.categories.length ? state.categories : [];
  const id = normalizeGender(value);
  return (
    categories.find((category) => category.id === id) || {
      id,
      label: id === "child" ? "Kind" : id === "female" ? "Frau" : "Mann",
      usesTechnique: id === "child",
    }
  );
}

function getQueue(lift) {
  const activeGroupId = state?.meta?.activeGroupId || getOrderedGroups()[0]?.id || null;
  return (state.athletes || [])
    .filter((athlete) => getAthleteGroupId(athlete) === activeGroupId)
    .filter((athlete) => !athlete.withdrawn)
    .map((athlete) => getAttemptInfo(athlete, lift))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      if (a.attemptNo !== b.attemptNo) return a.attemptNo - b.attemptNo;
      if (a.previousSequence !== b.previousSequence) return a.previousSequence - b.previousSequence;
      return a.athlete.startNo - b.athlete.startNo;
    });
}

function getOrderedGroups() {
  return [...(state?.groups || [])].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return String(a.name).localeCompare(String(b.name), "de-DE", { numeric: true });
  });
}

function getAthleteGroupId(athlete) {
  return athlete?.groupId || getOrderedGroups()[0]?.id || null;
}

function groupNameById(id) {
  const group = getOrderedGroups().find((item) => item.id === id) || getOrderedGroups()[0];
  return group?.name || "-";
}

function getAttemptInfo(athlete, lift) {
  const attempts = athlete.attempts?.[lift] || [];
  if (attempts.length >= 3) return null;
  const weight = Number(athlete.next?.[lift] || athlete.openers?.[lift]);
  if (!Number.isInteger(weight) || weight < 1) return null;
  return {
    athlete,
    lift,
    attemptNo: attempts.length + 1,
    weight,
    previousSequence: attempts.length ? attempts[attempts.length - 1].sequence : 0,
  };
}

function attemptKey(item) {
  return `${item.athlete.id}:${item.lift}:${item.attemptNo}`;
}

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
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
