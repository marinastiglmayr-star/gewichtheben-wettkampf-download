"use strict";

const LIFTS = {
  snatch: { label: "Reissen", short: "R" },
  cleanJerk: { label: "Stossen", short: "S" },
};

const AUTH_KEY = "gewichtheben-athleten-tablet";
const MAX_WAITING_ROOM_CHANGES = 2;

let auth = loadAuth();
let state = null;
let eventSource = null;
let heartbeatTimer = null;
let timerInterval = null;

const $ = (selector) => document.querySelector(selector);
const els = {};

document.addEventListener("DOMContentLoaded", async () => {
  Object.assign(els, {
    loginPanel: $("#login-panel"),
    tabletPanel: $("#tablet-panel"),
    loginForm: $("#login-form"),
    code: $("#code"),
    tabletLabel: $("#tablet-label"),
    logout: $("#logout"),
    attemptsBody: $("#attempts-body"),
    status: $("#status"),
    timer: $("#attempt-timer"),
    modeNote: $("#mode-note"),
  });

  els.loginForm.addEventListener("submit", register);
  els.logout.addEventListener("click", logout);
  document.body.addEventListener("click", handleClick);

  await loadState();
  startEvents();
  startHeartbeat();
  timerInterval = setInterval(() => {
    renderTimer();
    updateRowLocks();
  }, 1000);
  window.addEventListener("beforeunload", () => {
    if (!auth?.token || !navigator.sendBeacon) return;
    navigator.sendBeacon(
      "/api/tablet/logout",
      new Blob([JSON.stringify({ token: auth.token })], { type: "application/json" }),
    );
  });
  render();
});

async function register(event) {
  event.preventDefault();
  const response = await fetch("/api/tablet/register", {
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
  auth = { token: result.token, name: result.name || "Warteraum" };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  startHeartbeat();
  render();
}

async function logout() {
  if (auth?.token) {
    await fetch("/api/tablet/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: auth.token }),
    }).catch(() => {});
  }
  localStorage.removeItem(AUTH_KEY);
  auth = null;
  render();
}

async function handleClick(event) {
  const button = event.target.closest("[data-action='save-next']");
  if (!button) return;
  const input = document.querySelector(`[data-next-weight-key="${cssEscape(button.dataset.key)}"]`);
  const weight = parseInteger(input?.value);
  if (!weight) {
    setStatus("Bitte ein gueltiges Gewicht eintragen.");
    return;
  }
  await saveNextAttempt({
    athleteId: button.dataset.athleteId,
    lift: button.dataset.lift,
    attemptNo: parseInteger(button.dataset.attemptNo),
    weight,
  });
}

async function saveNextAttempt(payload) {
  if (!auth?.token) return;
  const response = await fetch("/api/tablet/next-attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: auth.token, ...payload }),
  });
  const result = await response.json();
  if (!response.ok) {
    setStatus(result.error || "Aenderung nicht moeglich.");
    return;
  }
  if (result.state) state = normalizeState(result.state);
  if (document.activeElement) document.activeElement.blur();
  setStatus(`Gespeichert. Aenderungen: ${result.changes || 0} / ${MAX_WAITING_ROOM_CHANGES}.`);
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
    const response = await fetch("/api/tablet/heartbeat", {
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
  const iwfMode = state?.meta?.scoringMode === "IWF";
  document.body.classList.toggle("iwf-mode", iwfMode);
  els.modeNote.textContent = state?.meta?.mode === "competition"
    ? `${LIFTS[state.meta.activeLift]?.label || "Wettkampf"} - aktuelle Gruppe`
    : "Warten auf Wettkampf";
  const isLoggedIn = Boolean(auth?.token);
  els.loginPanel.classList.toggle("hidden", isLoggedIn);
  els.tabletPanel.classList.toggle("hidden", !isLoggedIn);
  renderTimer();
  if (!isLoggedIn) return;
  els.tabletLabel.textContent = auth.name || "Warteraum";
  if (document.activeElement?.matches?.("[data-next-weight-key]")) {
    updateRowLocks();
    return;
  }
  renderRows();
}

function renderRows() {
  const queue = getQueue(state?.meta?.activeLift);
  if (!queue.length) {
    els.attemptsBody.innerHTML = `<tr><td colspan="5" class="muted">Keine offenen Versuche.</td></tr>`;
    return;
  }

  const current = queue[0] || null;
  els.attemptsBody.innerHTML = queue
    .map((item, index) => {
      const key = attemptKey(item);
      const changes = getAttemptChangeCount(item.athlete, item.lift, item.attemptNo);
      const lockReason = getLockReason(item, current, changes);
      const minWeight = getMinimumEditableWeight(item, current);
      return `
        <tr class="${index === 0 ? "current" : ""}" data-row-key="${escapeHtml(key)}">
          <td><strong>${escapeHtml(item.athlete.name)}</strong><br><span class="muted">Gruppe ${escapeHtml(groupNameById(item.athlete.groupId))}</span></td>
          <td>${LIFTS[item.lift].short}${item.attemptNo}</td>
          <td>
            <div class="weight-cell">
              <input data-next-weight-key="${escapeHtml(key)}" type="number" min="${minWeight}" step="1" value="${item.weight}" ${lockReason ? "disabled" : ""} />
              <span>kg</span>
            </div>
          </td>
          <td>${changes} / ${MAX_WAITING_ROOM_CHANGES}</td>
          <td>
            <button type="button" class="primary-button" data-action="save-next" data-key="${escapeHtml(key)}" data-athlete-id="${escapeHtml(item.athlete.id)}" data-lift="${item.lift}" data-attempt-no="${item.attemptNo}" ${lockReason ? "disabled" : ""}>Speichern</button>
            ${lockReason ? `<p class="warning-text">${escapeHtml(lockReason)}</p>` : ""}
          </td>
        </tr>
      `;
    })
    .join("");
}

function updateRowLocks() {
  if (!state || state.meta?.mode !== "competition") return;
  const queue = getQueue(state.meta.activeLift);
  const current = queue[0] || null;
  queue.forEach((item) => {
    const key = attemptKey(item);
    const row = document.querySelector(`[data-row-key="${cssEscape(key)}"]`);
    if (!row) return;
    const changes = getAttemptChangeCount(item.athlete, item.lift, item.attemptNo);
    const lockReason = getLockReason(item, current, changes);
    row.querySelectorAll("input, button").forEach((control) => {
      control.disabled = Boolean(lockReason);
    });
    const input = row.querySelector("input");
    if (input) input.min = String(getMinimumEditableWeight(item, current));
  });
}

function getLockReason(item, current, changes) {
  if (!auth?.token) return "nicht verbunden";
  if (state?.meta?.mode !== "competition" || state?.meta?.breakPending) return "kein aktiver Versuch";
  if (changes >= MAX_WAITING_ROOM_CHANGES) return `max. ${MAX_WAITING_ROOM_CHANGES} Aenderungen`;
  if (current && attemptKey(item) === attemptKey(current) && isTimerStartedForCurrent(item) && getRemainingSeconds() <= 30) {
    return "Final Call";
  }
  return "";
}

function getMinimumEditableWeight(item, current) {
  if (current && attemptKey(item) === attemptKey(current) && isTimerStartedForCurrent(item)) {
    return item.weight;
  }
  return 1;
}

function isTimerStartedForCurrent(item) {
  const timer = state?.meta?.attemptTimer;
  return Boolean(timer?.startedBy && timer?.startedAt && timer.key === attemptKey(item));
}

function renderTimer() {
  const timer = state?.meta?.attemptTimer;
  if (!els.timer) return;
  if (!timer?.startedBy || !timer?.startedAt || !timer.seconds) {
    els.timer.textContent = "--";
    els.timer.classList.remove("warning", "paused");
    return;
  }
  const remaining = getRemainingSeconds();
  els.timer.textContent = timer.paused ? `${remaining}s Pause` : `${remaining}s`;
  els.timer.classList.toggle("warning", remaining <= 10);
  els.timer.classList.toggle("paused", Boolean(timer.paused));
}

function getRemainingSeconds() {
  const timer = state?.meta?.attemptTimer;
  if (!timer?.seconds) return 0;
  if (!timer.startedBy || !timer.startedAt) return Math.max(0, Number(timer.remaining) || Number(timer.seconds) || 0);
  if (timer.paused) return Math.max(0, Number(timer.remaining) || 0);
  return Math.max(0, Number(timer.seconds) - Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000));
}

function getQueue(lift) {
  if (!state || state.meta?.mode !== "competition" || state.meta?.breakPending) return [];
  const activeLift = lift || state.meta.activeLift;
  const activeGroupId = state.meta.activeGroupId || getOrderedGroups()[0]?.id || null;
  return (state.athletes || [])
    .filter((athlete) => getAthleteGroupId(athlete) === activeGroupId)
    .filter((athlete) => !athlete.withdrawn)
    .map((athlete) => getAttemptInfo(athlete, activeLift))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      if (a.attemptNo !== b.attemptNo) return a.attemptNo - b.attemptNo;
      if (a.previousSequence !== b.previousSequence) return a.previousSequence - b.previousSequence;
      return Number(a.athlete.startNo || 0) - Number(b.athlete.startNo || 0);
    });
}

function getAttemptInfo(athlete, lift) {
  const attempts = athlete.attempts?.[lift] || [];
  if (attempts.length >= 3) return null;
  const weight = parseInteger(athlete.next?.[lift] || athlete.openers?.[lift]);
  if (!weight) return null;
  return {
    athlete,
    lift,
    attemptNo: attempts.length + 1,
    weight,
    previousSequence: attempts.length ? attempts[attempts.length - 1].sequence : 0,
  };
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
  return getOrderedGroups().find((item) => item.id === id)?.name || "-";
}

function attemptKey(item) {
  return `${item.athlete.id}:${item.lift}:${item.attemptNo}`;
}

function getAttemptChangeCount(athlete, lift, attemptNo) {
  const value = athlete?.nextChangeCounts?.[`${lift}:${attemptNo}`];
  return Math.max(0, parseInteger(value) || 0);
}

function normalizeState(input) {
  return {
    ...input,
    athletes: Array.isArray(input?.athletes)
      ? input.athletes.map((athlete) => ({
          ...athlete,
          nextChangeCounts: normalizeNextChangeCounts(athlete.nextChangeCounts),
        }))
      : [],
  };
}

function normalizeNextChangeCounts(input) {
  const output = {};
  if (!input || typeof input !== "object") return output;
  Object.entries(input).forEach(([key, value]) => {
    if (!/^(snatch|cleanJerk):[123]$/.test(key)) return;
    output[key] = Math.min(Math.max(parseInteger(value) || 0, 0), MAX_WAITING_ROOM_CHANGES);
  });
  return output;
}

function setStatus(message) {
  if (els.status) els.status.textContent = message;
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replaceAll('"', '\\"');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
