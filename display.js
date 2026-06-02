"use strict";

const DISPLAY_ID_KEY = "gewichtheben-display-station-id";
const DISPLAY_NAME_KEY = "gewichtheben-display-station-name";

const ROLE_PATHS = {
  plates: "/plates",
  scoreboard: "/scoreboard",
  waitingRoom: "/pi",
};

const ROLE_LABELS = {
  plates: "Scheibenanzeige",
  scoreboard: "Protokoll und Ergebnisse",
  waitingRoom: "Warteraum-Anzeige",
};

let displayId = getOrCreateDisplayId();
let displayName = getDisplayName();
let currentRole = "";
let eventSource = null;
let heartbeatTimer = null;

const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", async () => {
  renderWaiting("Verbindung wird aufgebaut.");
  await registerDisplay();
  startEvents();
  startHeartbeat();
});

function getOrCreateDisplayId() {
  const existing = localStorage.getItem(DISPLAY_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID ? crypto.randomUUID() : `display-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(DISPLAY_ID_KEY, id);
  return id;
}

function getDisplayName() {
  const params = new URLSearchParams(location.search);
  const requestedName = params.get("name")?.trim();
  if (requestedName) {
    localStorage.setItem(DISPLAY_NAME_KEY, requestedName);
    return requestedName;
  }
  const existing = localStorage.getItem(DISPLAY_NAME_KEY);
  if (existing) return existing;
  const name = `Bildschirm ${displayId.slice(0, 4).toUpperCase()}`;
  localStorage.setItem(DISPLAY_NAME_KEY, name);
  return name;
}

async function registerDisplay() {
  try {
    const response = await fetch("/api/display/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: displayId, name: displayName }),
    });
    if (!response.ok) throw new Error("register failed");
    const result = await response.json();
    if (result.name) displayName = result.name;
    applyAssignment(result.assignment || result.session?.displayAssignments?.[displayId] || "");
  } catch (error) {
    renderWaiting("Keine Verbindung zum Wettkampf-PC.");
  }
}

function startEvents() {
  if (eventSource) return;
  eventSource = new EventSource("/api/events");
  eventSource.addEventListener("session", (event) => {
    const session = JSON.parse(event.data);
    const client = (session.displayClients || []).find((item) => item.id === displayId);
    applyAssignment(client?.assignment || session.displayAssignments?.[displayId] || "");
  });
  eventSource.addEventListener("error", () => {
    renderStatus("Live-Verbindung wird wiederhergestellt.");
  });
}

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(sendHeartbeat, 5000);
}

async function sendHeartbeat() {
  try {
    const response = await fetch("/api/display/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: displayId, name: displayName }),
    });
    if (!response.ok) return;
    const result = await response.json();
    applyAssignment(result.assignment || result.session?.displayAssignments?.[displayId] || "");
  } catch (error) {
    renderStatus("Verbindung wird wiederhergestellt.");
  }
}

function applyAssignment(role) {
  const nextRole = ROLE_PATHS[role] ? role : "";
  if (nextRole === currentRole) return;
  currentRole = nextRole;
  const frame = $("#display-frame");
  const waiting = $("#waiting-panel");
  if (!nextRole) {
    frame.removeAttribute("src");
    frame.classList.add("hidden");
    waiting.classList.remove("hidden");
    renderWaiting("Diese Anzeige ist verbunden und wartet auf eine Ansicht.");
    return;
  }

  frame.src = ROLE_PATHS[nextRole];
  frame.classList.remove("hidden");
  waiting.classList.add("hidden");
  document.title = `${ROLE_LABELS[nextRole]} - Bildschirmstation`;
}

function renderWaiting(status) {
  $("#display-name").textContent = displayName;
  $("#display-status").textContent = status;
  $("#display-address").textContent = `Kennung: ${displayId.slice(0, 8).toUpperCase()}`;
}

function renderStatus(status) {
  if (!currentRole) renderWaiting(status);
}
