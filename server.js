"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn, spawnSync } = require("node:child_process");

const PORT = Number(process.env.PORT) || 8765;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "competition-state.json");
const YOUTUBE_SETTINGS_FILE = path.join(ROOT, "youtube-live-settings.json");
const BACKUP_DIR = path.join(ROOT, "backups");
const LATEST_BACKUP_FILE = "latest.json";
const MAX_BACKUPS = 200;
const CLIENTS = new Set();
const CONTROL_CLIENTS = new Map();
const CONTROL_CLIENT_TIMEOUT_MS = 15000;
const TABLET_CLIENTS = new Map();
const TABLET_CLIENT_TIMEOUT_MS = 15000;
const WEIGH_CLIENTS = new Map();
const WEIGH_CLIENT_TIMEOUT_MS = 15000;
const DISPLAY_CLIENTS = new Map();
const DISPLAY_CLIENT_TIMEOUT_MS = 15000;
const MAX_WAITING_ROOM_CHANGES = 2;
const DISPLAY_ROLES = new Set(["", "plates", "scoreboard", "waitingRoom"]);
const YOUTUBE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube";

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

const DEFAULT_GROUP = {
  id: "group-a",
  name: "A",
  order: 1,
  completed: false,
  snatchCompleted: false,
  cleanJerkCompleted: false,
};

const BAR_WEIGHTS = {
  male: 20,
  female: 15,
  child: 5,
};

const AGE_CLASSES = new Set(["children", "school", "youth", "junior", "senior", "masters"]);

const WEIGHT_CLASSES = {
  senior: {
    male: ["60", "65", "71", "79", "88", "94", "110", "+110"],
    female: ["48", "53", "58", "63", "69", "77", "86", "+86"],
  },
  youth: {
    male: ["56", "60", "65", "71", "79", "88", "94", "+94"],
    female: ["44", "48", "53", "58", "63", "69", "77", "+77"],
  },
  child: {
    child: ["35", "40", "45", "49", "55", "59", "64", "69", "73", "+73"],
  },
};

const DEFAULT_PLATES = [
  { id: "plate-25", weight: 25, color: "#c9262d", size: 238 },
  { id: "plate-20", weight: 20, color: "#1f68b6", size: 238 },
  { id: "plate-15", weight: 15, color: "#f3c832", size: 212 },
  { id: "plate-10", weight: 10, color: "#27834a", size: 184 },
  { id: "plate-5", weight: 5, color: "#f7f8f7", size: 146 },
  { id: "plate-2-5", weight: 2.5, color: "#f28c28", size: 112 },
  { id: "plate-2", weight: 2, color: "#2b78d0", size: 98 },
  { id: "plate-1", weight: 1, color: "#39a35b", size: 84 },
  { id: "plate-0-5", weight: 0.5, color: "#f3d44d", size: 70 },
];

const DEFAULT_CATEGORIES = [
  { id: "male", label: "Mann", barWeight: 20, weightClassType: "male", relativeKey: "male", usesTechnique: false, includeCollars: true },
  { id: "female", label: "Frau", barWeight: 15, weightClassType: "female", relativeKey: "female", usesTechnique: false, includeCollars: true },
  { id: "child", label: "Kind", barWeight: 5, weightClassType: "child", relativeKey: "child", usesTechnique: true, includeCollars: false },
];

const IWF_MINIMUM_ATTEMPT_WEIGHT = {
  female: 21,
  male: 26,
};

const DEFAULT_AGE_FACTOR_START_AGE = 30;
const DEFAULT_AGE_FACTOR_VALUES = {
  male:
    "30:1,31:1.016,32:1.031,33:1.046,34:1.059,35:1.072,36:1.083,37:1.096,38:1.109,39:1.122,40:1.135,41:1.149,42:1.162,43:1.176,44:1.189,45:1.203,46:1.218,47:1.233,48:1.248,49:1.263,50:1.279,51:1.297,52:1.316,53:1.338,54:1.361,55:1.385,56:1.411,57:1.437,58:1.462,59:1.488,60:1.514,61:1.541,62:1.568,63:1.598,64:1.629,65:1.663,66:1.699,67:1.738,68:1.779,69:1.823,70:1.867,71:1.91,72:1.953,73:2.004,74:2.06,75:2.117,76:2.181,77:2.255,78:2.336,79:2.419,80:2.504,81:2.597,82:2.702,83:2.831,84:2.981,85:3.153,86:3.352,87:3.58,88:3.843,89:4.145,90:4.493",
  female:
    "30:1,31:1.016,32:1.031,33:1.046,34:1.059,35:1.072,36:1.084,37:1.097,38:1.11,39:1.124,40:1.138,41:1.153,42:1.17,43:1.187,44:1.205,45:1.223,46:1.244,47:1.265,48:1.288,49:1.313,50:1.34,51:1.369,52:1.401,53:1.435,54:1.47,55:1.507,56:1.545,57:1.585,58:1.625,59:1.665,60:1.705,61:1.744,62:1.778,63:1.808,64:1.839,65:1.873,66:1.909,67:1.948,68:1.989,69:2.033,70:2.077,71:2.12,72:2.163,73:2.214,74:2.27,75:2.327,76:2.391,77:2.465,78:2.546,79:2.629,80:2.714",
};

const MIME = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".json": "application/json;charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

const judges = {
  solo: null,
  left: null,
  center: null,
  right: null,
};
const tokens = new Map();

let state = defaultState();
let sessionCode = makeSessionCode();
let youtubeConfig = defaultYoutubeConfig();
let youtubeRuntime = defaultYoutubeRuntime();
let youtubePendingOAuth = null;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  state = await loadState();
  youtubeConfig = await loadYoutubeConfig();
  syncPhase();
  await persistState();

  const server = http.createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: "Interner Serverfehler" });
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Gewichtheben-App läuft auf http://localhost:${PORT}`);
    for (const url of getLanUrls("/")) console.log(`PC: ${url}`);
    for (const url of getLanUrls("/judge")) console.log(`Kampfrichter: ${url}`);
    for (const url of getLanUrls("/waage")) console.log(`Waage: ${url}`);
    for (const url of getLanUrls("/warteraum")) console.log(`Warteraum: ${url}`);
    for (const url of getLanUrls("/pi")) console.log(`Warteraum-Anzeige: ${url}`);
    for (const url of getLanUrls("/display")) console.log(`Bildschirmstation: ${url}`);
    console.log(`Verbindungscode: ${sessionCode}`);
  });
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);

  if (url.pathname === "/api/state" && req.method === "GET") {
    sendJson(res, 200, state);
    return;
  }

  if (url.pathname === "/api/state" && req.method === "PUT") {
    const incoming = await readJson(req);
    if (
      incoming?.meta?.judgeConnections &&
      Object.values(incoming.meta.judgeConnections).every((judge) => !judge)
    ) {
      clearJudges();
    }
    state = normalizeState(incoming);
    syncPhase();
    await persistState();
    broadcastSession();
    broadcastState();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/backups" && req.method === "GET") {
    await listBackups(req, res);
    return;
  }

  if (url.pathname === "/api/backups/restore" && req.method === "POST") {
    await restoreBackup(req, res);
    return;
  }

  if (url.pathname === "/api/youtube/status" && req.method === "GET") {
    sendJson(res, 200, getYoutubePayload());
    return;
  }

  if (url.pathname === "/api/youtube/settings" && req.method === "POST") {
    await updateYoutubeSettings(req, res);
    return;
  }

  if (url.pathname === "/api/youtube/auth/start" && req.method === "POST") {
    await startYoutubeAuth(req, res);
    return;
  }

  if (url.pathname === "/api/youtube/oauth-callback" && req.method === "GET") {
    await handleYoutubeOAuthCallback(url, res);
    return;
  }

  if (url.pathname === "/api/youtube/start" && req.method === "POST") {
    await startYoutubeLivestream(req, res);
    return;
  }

  if (url.pathname === "/api/youtube/media-chunk" && req.method === "POST") {
    await receiveYoutubeMediaChunk(req, res);
    return;
  }

  if (url.pathname === "/api/youtube/stop" && req.method === "POST") {
    await stopYoutubeLivestream(req, res);
    return;
  }

  if (url.pathname === "/api/teams" && req.method === "POST") {
    await addTeam(req, res);
    return;
  }

  if (url.pathname.startsWith("/api/teams/") && req.method === "DELETE") {
    await deleteTeam(req, res, decodeURIComponent(url.pathname.replace("/api/teams/", "")));
    return;
  }

  if (url.pathname === "/api/session" && req.method === "GET") {
    sendJson(res, 200, getSessionPayload(req));
    return;
  }

  if (url.pathname === "/api/session/rotate" && req.method === "POST") {
    if (!isLoopbackRequest(req)) {
      sendJson(res, 403, { error: "Code kann nur lokal am PC erneuert werden." });
      return;
    }
    await rotateSessionCode();
    sendJson(res, 200, getSessionPayload(req));
    return;
  }

  if (url.pathname === "/api/control/register" && req.method === "POST") {
    await registerControlClient(req, res);
    return;
  }

  if (url.pathname === "/api/control/logout" && req.method === "POST") {
    await logoutControlClient(req, res);
    return;
  }

  if (url.pathname === "/api/display/register" && req.method === "POST") {
    await registerDisplayClient(req, res);
    return;
  }

  if (url.pathname === "/api/display/heartbeat" && req.method === "POST") {
    await heartbeatDisplayClient(req, res);
    return;
  }

  if (url.pathname === "/api/display/assign" && req.method === "POST") {
    await assignDisplayClient(req, res);
    return;
  }

  if (url.pathname === "/api/tablet/register" && req.method === "POST") {
    await registerTabletClient(req, res);
    return;
  }

  if (url.pathname === "/api/tablet/heartbeat" && req.method === "POST") {
    await heartbeatTabletClient(req, res);
    return;
  }

  if (url.pathname === "/api/tablet/logout" && req.method === "POST") {
    await logoutTabletClient(req, res);
    return;
  }

  if (url.pathname === "/api/tablet/next-attempt" && req.method === "POST") {
    await updateTabletNextAttempt(req, res);
    return;
  }

  if (url.pathname === "/api/weigh/register" && req.method === "POST") {
    await registerWeighClient(req, res);
    return;
  }

  if (url.pathname === "/api/weigh/heartbeat" && req.method === "POST") {
    await heartbeatWeighClient(req, res);
    return;
  }

  if (url.pathname === "/api/weigh/logout" && req.method === "POST") {
    await logoutWeighClient(req, res);
    return;
  }

  if (url.pathname === "/api/weigh/athlete-data" && req.method === "POST") {
    await updateWeighAthleteData(req, res);
    return;
  }

  if (url.pathname === "/api/weigh/athlete-missing" && req.method === "POST") {
    await updateWeighAthleteMissing(req, res);
    return;
  }

  if (url.pathname === "/api/qr.svg" && req.method === "GET") {
    const data = url.searchParams.get("data") || "";
    if (!data) {
      sendJson(res, 400, { error: "Keine QR-Daten" });
      return;
    }
    const svg = createQrSvg(data);
    res.writeHead(200, {
      "Content-Type": "image/svg+xml;charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(svg);
    return;
  }

  if (url.pathname === "/api/events" && req.method === "GET") {
    openEventStream(req, res);
    return;
  }

  if (url.pathname === "/api/judges/register" && req.method === "POST") {
    await registerJudge(req, res);
    return;
  }

  if (url.pathname === "/api/judges/vote" && req.method === "POST") {
    await recordJudgeVote(req, res);
    return;
  }

  if (url.pathname === "/api/judges/clear-votes" && req.method === "POST") {
    await clearJudgeVotes(req, res);
    return;
  }

  if (url.pathname === "/api/judges/record-attempt" && req.method === "POST") {
    await recordAttemptFromJudge(req, res);
    return;
  }

  if (url.pathname === "/api/judges/start-timer" && req.method === "POST") {
    await startTimerFromJudge(req, res);
    return;
  }

  if (url.pathname === "/api/judges/toggle-timer" && req.method === "POST") {
    await toggleTimerFromJudge(req, res);
    return;
  }

  if (url.pathname === "/api/judges/logout" && req.method === "POST") {
    await logoutJudge(req, res);
    return;
  }

  await serveStatic(url.pathname, res);
}

async function registerJudge(req, res) {
  const body = await readJson(req);
  const requestedRole = String(body.role || "");
  const role = getRefereeCount() === 1 ? "solo" : requestedRole;
  const name = String(body.name || "").trim();

  if (String(body.code || "") !== sessionCode) {
    sendJson(res, 403, { error: "Falscher Verbindungscode" });
    return;
  }

  if (!getActiveRoleKeys().includes(role)) {
    sendJson(res, 400, { error: "Unbekannte Kampfrichterposition" });
    return;
  }

  if (judges[role]?.token) tokens.delete(judges[role].token);

  const token = crypto.randomUUID();
  judges[role] = {
    token,
    name: name || ROLE_LABELS[role],
    role,
    connectedAt: new Date().toISOString(),
  };
  tokens.set(token, role);

  state.meta.judgeConnections = sanitizeJudges();
  await persistState();
  broadcastSession();
  broadcastState();

  sendJson(res, 200, {
    token,
    role,
    label: ROLE_LABELS[role],
    name: judges[role].name,
  });
}

async function registerControlClient(req, res) {
  const body = await readJson(req);
  const token = String(body.token || crypto.randomUUID());
  const now = new Date().toISOString();
  const existing = CONTROL_CLIENTS.get(token);
  const address = getRemoteAddress(req);
  const name = String(body.name || existing?.name || defaultControlClientName(req)).trim();

  CONTROL_CLIENTS.set(token, {
    token,
    name: name || defaultControlClientName(req),
    address,
    isLocal: isHostAddress(address),
    connectedAt: existing?.connectedAt || now,
    lastSeen: now,
  });

  cleanupControlClients();
  broadcastSession();
  sendJson(res, 200, {
    token,
    session: getSessionPayload(req),
  });
}

async function logoutControlClient(req, res) {
  const body = await readJson(req);
  const token = String(body.token || "");
  if (token) {
    CONTROL_CLIENTS.delete(token);
    broadcastSession();
  }
  sendJson(res, 200, { ok: true });
}

async function registerDisplayClient(req, res) {
  const body = await readJson(req);
  const token = String(body.id || body.token || crypto.randomUUID());
  const now = new Date().toISOString();
  const existing = DISPLAY_CLIENTS.get(token);
  const address = getRemoteAddress(req);
  const name = sanitizeDisplayClientName(body.name || existing?.name || defaultDisplayClientName(req, token));

  DISPLAY_CLIENTS.set(token, {
    token,
    name,
    address,
    connectedAt: existing?.connectedAt || now,
    lastSeen: now,
  });

  cleanupDisplayClients();
  broadcastSession();
  sendJson(res, 200, {
    id: token,
    name,
    assignment: getDisplayAssignment(token),
    session: getSessionPayload(req),
  });
}

async function heartbeatDisplayClient(req, res) {
  const body = await readJson(req);
  const token = String(body.id || body.token || "");
  if (!token || !DISPLAY_CLIENTS.has(token)) {
    await registerDisplayClient(req, res);
    return;
  }

  const client = DISPLAY_CLIENTS.get(token);
  client.lastSeen = new Date().toISOString();
  if (body.name) client.name = sanitizeDisplayClientName(body.name);
  cleanupDisplayClients();
  broadcastSession();
  sendJson(res, 200, {
    ok: true,
    assignment: getDisplayAssignment(token),
    session: getSessionPayload(req),
  });
}

async function assignDisplayClient(req, res) {
  const body = await readJson(req);
  const token = String(body.id || body.token || "");
  const role = normalizeDisplayRole(body.role);
  if (!token) {
    sendJson(res, 400, { error: "Bildschirm nicht gefunden." });
    return;
  }

  state.meta.displayAssignments = normalizeDisplayAssignments(state.meta.displayAssignments);
  if (role) state.meta.displayAssignments[token] = role;
  else delete state.meta.displayAssignments[token];

  await persistState();
  broadcastSession();
  sendJson(res, 200, {
    ok: true,
    assignment: getDisplayAssignment(token),
    session: getSessionPayload(req),
  });
}

async function registerTabletClient(req, res) {
  const body = await readJson(req);
  if (String(body.code || "") !== sessionCode) {
    sendJson(res, 403, { error: "Falscher Verbindungscode" });
    return;
  }

  const token = String(body.token || crypto.randomUUID());
  const now = new Date().toISOString();
  const existing = TABLET_CLIENTS.get(token);
  const address = getRemoteAddress(req);
  const name = defaultTabletClientName(req);

  TABLET_CLIENTS.set(token, {
    token,
    name: name || defaultTabletClientName(req),
    address,
    connectedAt: existing?.connectedAt || now,
    lastSeen: now,
  });

  cleanupTabletClients();
  broadcastSession();
  sendJson(res, 200, {
    token,
    name: TABLET_CLIENTS.get(token).name,
    session: getSessionPayload(req),
  });
}

async function heartbeatTabletClient(req, res) {
  const body = await readJson(req);
  const tablet = getTabletForToken(body.token);
  if (!tablet) {
    sendJson(res, 401, { error: "Warteraum nicht angemeldet" });
    return;
  }

  tablet.lastSeen = new Date().toISOString();
  cleanupTabletClients();
  broadcastSession();
  sendJson(res, 200, { ok: true, session: getSessionPayload(req) });
}

async function logoutTabletClient(req, res) {
  const body = await readJson(req);
  const token = String(body.token || "");
  if (token) {
    TABLET_CLIENTS.delete(token);
    broadcastSession();
  }
  sendJson(res, 200, { ok: true });
}

async function updateTabletNextAttempt(req, res) {
  const body = await readJson(req);
  const tablet = getTabletForToken(body.token);
  if (!tablet) {
    sendJson(res, 401, { error: "Warteraum nicht angemeldet" });
    return;
  }
  tablet.lastSeen = new Date().toISOString();

  if (state.meta.mode !== "competition" || state.meta.breakPending) {
    sendJson(res, 400, { error: "Kein aktiver Wettkampfversuch." });
    return;
  }

  const athlete = state.athletes.find((item) => item.id === String(body.athleteId || ""));
  const lift = String(body.lift || "");
  const weight = parseInteger(body.weight);
  const attemptNo = parseInteger(body.attemptNo);
  if (!athlete || athlete.withdrawn || getAthleteGroupId(athlete) !== state.meta.activeGroupId) {
    sendJson(res, 404, { error: "Athlet nicht im aktuellen Durchgang." });
    return;
  }
  if (lift !== state.meta.activeLift) {
    sendJson(res, 409, { error: "Der Abschnitt hat sich geaendert." });
    return;
  }

  const attemptInfo = getAttemptInfo(athlete, lift);
  if (!attemptInfo || attemptInfo.attemptNo !== attemptNo) {
    sendJson(res, 409, { error: "Der Versuch hat sich geaendert." });
    return;
  }

  const currentBefore = getCurrentAttempt();
  const currentKey = currentBefore ? attemptKey(currentBefore) : "";
  const targetKey = attemptKey(attemptInfo);
  if (!Number.isInteger(weight) || weight < 1) {
    sendJson(res, 400, { error: "Bitte ein gueltiges Gewicht eintragen." });
    return;
  }

  const warning = attemptWeightWarning(athlete, lift, weight);
  if (warning) {
    sendJson(res, 400, { error: warning });
    return;
  }

  const existingWeight = parseInteger(athlete.next?.[lift] || athlete.openers?.[lift]);
  const targetIsCurrent = currentKey === targetKey;
  const targetTimer = targetIsCurrent ? state.meta.attemptTimer : null;
  const targetTimerStarted = Boolean(targetTimer?.startedBy && targetTimer?.startedAt && targetTimer.key === targetKey);
  const currentRemaining = targetTimer ? remainingTimerSeconds(targetTimer) : 0;
  if (weight !== existingWeight && targetIsCurrent && targetTimerStarted && currentRemaining <= 30) {
    sendJson(res, 409, { error: "Aenderung nur bis 31 Sekunden moeglich." });
    return;
  }
  if (weight < existingWeight && targetIsCurrent && targetTimerStarted) {
    sendJson(res, 409, { error: "Reduzierung nur vor dem Start der Uhr moeglich." });
    return;
  }
  const currentChangeCount = getAttemptChangeCount(athlete, lift, attemptNo);
  if (weight !== existingWeight && currentChangeCount >= MAX_WAITING_ROOM_CHANGES) {
    sendJson(res, 409, { error: `Maximal ${MAX_WAITING_ROOM_CHANGES} Aenderungen pro Versuch.` });
    return;
  }

  const pauseRunningTimerForSameAthlete =
    weight > existingWeight &&
    targetIsCurrent &&
    targetTimerStarted &&
    !targetTimer.paused &&
    targetTimer.key === targetKey;
  const remainingBeforePause = pauseRunningTimerForSameAthlete ? remainingTimerSeconds(targetTimer) : null;

  athlete.next[lift] = weight;
  if (weight !== existingWeight) {
    setAttemptChangeCount(athlete, lift, attemptNo, currentChangeCount + 1);
  }

  syncPhase();
  const currentAfter = getCurrentAttempt();
  const nextKey = currentAfter ? attemptKey(currentAfter) : "";
  if (currentKey && nextKey && currentKey !== nextKey) {
    state.meta.liveVotes = { key: null, votes: [null, null, null] };
    state.meta.liveTechnique = { key: null, points: [null, null, null] };
    setAttemptTimerForNext(null);
  } else {
    ensureAttemptTimerForCurrent();
  }
  const finalCurrent = getCurrentAttempt();
  if (pauseRunningTimerForSameAthlete && finalCurrent && attemptKey(finalCurrent) === targetKey) {
    state.meta.attemptTimer = {
      ...state.meta.attemptTimer,
      paused: true,
      remaining: remainingBeforePause,
    };
  }

  await persistState();
  broadcastSession();
  broadcastState();
  sendJson(res, 200, {
    ok: true,
    changes: getAttemptChangeCount(athlete, lift, attemptNo),
    state,
  });
}

async function registerWeighClient(req, res) {
  const body = await readJson(req);
  if (String(body.code || "") !== sessionCode) {
    sendJson(res, 403, { error: "Falscher Verbindungscode" });
    return;
  }

  const token = String(body.token || crypto.randomUUID());
  const now = new Date().toISOString();
  const existing = WEIGH_CLIENTS.get(token);
  const address = getRemoteAddress(req);

  WEIGH_CLIENTS.set(token, {
    token,
    name: defaultWeighClientName(),
    address,
    connectedAt: existing?.connectedAt || now,
    lastSeen: now,
  });

  cleanupWeighClients();
  broadcastSession();
  sendJson(res, 200, {
    token,
    name: defaultWeighClientName(),
    session: getSessionPayload(req),
  });
}

async function heartbeatWeighClient(req, res) {
  const body = await readJson(req);
  const client = getWeighClientForToken(body.token);
  if (!client) {
    sendJson(res, 401, { error: "Waage nicht angemeldet" });
    return;
  }
  client.lastSeen = new Date().toISOString();
  cleanupWeighClients();
  broadcastSession();
  sendJson(res, 200, { ok: true, session: getSessionPayload(req) });
}

async function logoutWeighClient(req, res) {
  const body = await readJson(req);
  const token = String(body.token || "");
  if (token) {
    WEIGH_CLIENTS.delete(token);
    broadcastSession();
  }
  sendJson(res, 200, { ok: true });
}

async function updateWeighAthleteData(req, res) {
  const body = await readJson(req);
  const client = getWeighClientForToken(body.token);
  if (!client) {
    sendJson(res, 401, { error: "Waage nicht angemeldet" });
    return;
  }
  client.lastSeen = new Date().toISOString();

  const athlete = state.athletes.find((item) => item.id === String(body.athleteId || ""));
  if (!athlete) {
    sendJson(res, 404, { error: "Athlet nicht gefunden." });
    return;
  }

  const lockReason = weighDataLockReason(athlete);
  if (lockReason) {
    sendJson(res, 409, { error: lockReason });
    return;
  }

  const bodyweight = parseOptionalPositiveFloat(body.bodyweight);
  const snatch = parseOptionalPositiveInteger(body.snatch);
  const cleanJerk = parseOptionalPositiveInteger(body.cleanJerk);
  if (bodyweight === undefined || snatch === undefined || cleanJerk === undefined) {
    sendJson(res, 400, { error: "Bitte Waagedaten pruefen." });
    return;
  }

  athlete.bodyweight = bodyweight;
  athlete.openers = athlete.openers || { snatch: null, cleanJerk: null };
  athlete.openers.snatch = snatch;
  athlete.openers.cleanJerk = cleanJerk;
  athlete.next = {
    snatch: athlete.attempts?.snatch?.length ? athlete.next?.snatch : snatch,
    cleanJerk: athlete.attempts?.cleanJerk?.length ? athlete.next?.cleanJerk : cleanJerk,
  };

  state = normalizeState(state);
  await persistState();
  broadcastSession();
  broadcastState();
  sendJson(res, 200, { ok: true, state });
}

async function updateWeighAthleteMissing(req, res) {
  const body = await readJson(req);
  const client = getWeighClientForToken(body.token);
  if (!client) {
    sendJson(res, 401, { error: "Waage nicht angemeldet" });
    return;
  }
  client.lastSeen = new Date().toISOString();

  const athlete = state.athletes.find((item) => item.id === String(body.athleteId || ""));
  if (!athlete) {
    sendJson(res, 404, { error: "Athlet nicht gefunden." });
    return;
  }

  if (hasAnyRecordedAttempt(athlete)) {
    sendJson(res, 409, { error: "Athlet hat bereits Versuche im Wettkampf." });
    return;
  }

  if (state.meta.mode !== "setup" && state.meta.activeGroupId && getAthleteGroupId(athlete) === state.meta.activeGroupId) {
    sendJson(res, 409, { error: "Die aktive Gruppe kann an der Waage nicht als fehlend markiert werden." });
    return;
  }

  athlete.withdrawn = Boolean(body.missing);
  state = normalizeState(state);
  syncPhase();
  await persistState();
  broadcastSession();
  broadcastState();
  sendJson(res, 200, { ok: true, state });
}

async function recordJudgeVote(req, res) {
  const body = await readJson(req);
  const role = getRoleForToken(body.token);
  if (!role) {
    sendJson(res, 401, { error: "Kampfrichter nicht angemeldet" });
    return;
  }
  if (!getActiveRoleKeys().includes(role)) {
    sendJson(res, 401, { error: "Kampfrichtermodus wurde geändert. Bitte neu anmelden." });
    return;
  }

  const key = String(body.key || "");
  if (!key) {
    sendJson(res, 400, { error: "Kein aktueller Versuch" });
    return;
  }

  const vote = body.vote === "good";
  if (!state.meta.liveVotes || state.meta.liveVotes.key !== key) {
    state.meta.liveVotes = { key, votes: [null, null, null] };
  }
  if (!state.meta.liveTechnique || state.meta.liveTechnique.key !== key) {
    state.meta.liveTechnique = { key, points: [null, null, null] };
  }
  state.meta.liveVotes.votes[ROLE_INDEX[role]] = vote;
  const techniquePoints = Number(body.techniquePoints);
  if (Number.isFinite(techniquePoints)) {
    state.meta.liveTechnique.points[ROLE_INDEX[role]] = techniquePoints;
  }

  await persistState();
  broadcastState();
  sendJson(res, 200, { ok: true, role, vote });
}

async function clearJudgeVotes(req, res) {
  const body = await readJson(req);
  const role = getRoleForToken(body.token);
  if (!canControlAttempts(role)) {
    sendJson(res, 401, { error: "Nur Hauptkampfrichter dürfen leeren." });
    return;
  }

  const key = String(body.key || state.meta.liveVotes?.key || "");
  state.meta.liveVotes = { key: key || null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: key || null, points: [null, null, null] };
  await persistState();
  broadcastState();
  sendJson(res, 200, { ok: true });
}

async function recordAttemptFromJudge(req, res) {
  const body = await readJson(req);
  const role = getRoleForToken(body.token);
  if (!canControlAttempts(role)) {
    sendJson(res, 401, { error: "Nur Hauptkampfrichter dürfen eintragen." });
    return;
  }
  if (state.meta.mode !== "competition" || state.meta.breakPending) {
    sendJson(res, 400, { error: "Kein aktiver Versuch." });
    return;
  }

  const current = getCurrentAttempt();
  if (!current) {
    sendJson(res, 400, { error: "Kein aktueller Versuch." });
    return;
  }
  const key = attemptKey(current);
  if (String(body.key || "") && String(body.key) !== key) {
    sendJson(res, 409, { error: "Der aufgerufene Versuch hat sich geändert." });
    return;
  }

  const warning = attemptWeightWarning(current.athlete, current.lift, current.weight);
  if (warning) {
    sendJson(res, 400, { error: warning });
    return;
  }

  ensureLiveKeys(key);
  const slots = getActiveRoleKeys();
  const activeVotes = slots.map((slot) => state.meta.liveVotes.votes[ROLE_INDEX[slot]]);
  if (activeVotes.some((vote) => vote === null)) {
    sendJson(res, 400, { error: slots.length === 1 ? "Bitte Stimme eintragen." : "Bitte alle Stimmen eintragen." });
    return;
  }

  const activeTechniquePoints = slots.map((slot) => {
    const point = Number(state.meta.liveTechnique?.points?.[ROLE_INDEX[slot]]);
    return Number.isFinite(point) ? point : null;
  });
  if (shouldUseTechnique(current.athlete) && activeTechniquePoints.some((point) => point === null)) {
    sendJson(res, 400, { error: "Bitte Technikpunkte eintragen." });
    return;
  }

  const goodVotes = activeVotes.filter(Boolean).length;
  const isGoodAttempt = goodVotes >= getRequiredGoodVotes();
  const attempt = {
    attemptNo: current.attemptNo,
    requestedWeight: current.weight,
    votes: { white: goodVotes, red: activeVotes.length - goodVotes },
    judges: [...activeVotes],
    techniquePoints: shouldUseTechnique(current.athlete) ? activeTechniquePoints : [],
    techniqueScore: shouldUseTechnique(current.athlete) ? calculateTechniqueScore(activeTechniquePoints) : null,
    refereeCount: slots.length,
    good: isGoodAttempt,
    sequence: state.meta.sequence + 1,
    time: new Date().toISOString(),
  };

  state.meta.sequence = attempt.sequence;
  current.athlete.attempts[current.lift].push(attempt);
  if (current.attemptNo < 3) {
    current.athlete.next[current.lift] = isGoodAttempt ? current.weight + 1 : current.weight;
  }
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  syncPhase();
  setAttemptTimerForNext(current.athlete.id);
  await persistState();
  broadcastState();
  sendJson(res, 200, { ok: true, attempt });
}

async function startTimerFromJudge(req, res) {
  const body = await readJson(req);
  const role = getRoleForToken(body.token);
  if (!canControlAttempts(role)) {
    sendJson(res, 401, { error: "Nur Hauptkampfrichter duerfen die Zeit starten." });
    return;
  }
  if (!getActiveRoleKeys().includes(role)) {
    sendJson(res, 401, { error: "Kampfrichtermodus wurde geaendert. Bitte neu anmelden." });
    return;
  }
  if (state.meta.mode !== "competition" || state.meta.breakPending) {
    sendJson(res, 400, { error: "Kein aktiver Versuch." });
    return;
  }

  syncPhase();
  ensureAttemptTimerForCurrent();
  const current = getCurrentAttempt();
  const timer = state.meta.attemptTimer;
  if (!current || !timer?.seconds || timer.key !== attemptKey(current)) {
    sendJson(res, 400, { error: "Keine vorbereitete Zeit vorhanden." });
    return;
  }

  if (timer.startedBy && timer.startedAt && !timer.paused) {
    sendJson(res, 200, { ok: true, timer });
    return;
  }

  const seconds = Math.max(
    0,
    timer.startedBy
      ? parseInteger(timer.remaining) || parseInteger(timer.seconds) || 0
      : parseInteger(timer.seconds) || 0,
  );
  if (!seconds) {
    sendJson(res, 400, { error: "Keine gueltige Zeit vorhanden." });
    return;
  }

  state.meta.attemptTimer = {
    ...timer,
    startedAt: new Date().toISOString(),
    seconds,
    paused: false,
    remaining: null,
    startedBy: role,
    athleteId: current.athlete.id,
    key: attemptKey(current),
  };
  await persistState();
  broadcastState();
  sendJson(res, 200, { ok: true, timer: state.meta.attemptTimer });
}

async function toggleTimerFromJudge(req, res) {
  const body = await readJson(req);
  const role = getRoleForToken(body.token);
  if (!canControlAttempts(role)) {
    sendJson(res, 401, { error: "Nur Hauptkampfrichter duerfen die Zeit steuern." });
    return;
  }
  if (!getActiveRoleKeys().includes(role)) {
    sendJson(res, 401, { error: "Kampfrichtermodus wurde geaendert. Bitte neu anmelden." });
    return;
  }

  const timer = state.meta.attemptTimer;
  if (!timer?.startedBy || !timer?.startedAt || !timer.seconds) {
    sendJson(res, 400, { error: "Zeit wurde noch nicht gestartet." });
    return;
  }

  state.meta.attemptTimer = toggleAttemptTimer(timer);
  await persistState();
  broadcastState();
  sendJson(res, 200, { ok: true, timer: state.meta.attemptTimer });
}

function toggleAttemptTimer(timer) {
  if (timer.paused) {
    return {
      ...timer,
      startedAt: new Date().toISOString(),
      seconds: Math.max(0, parseInteger(timer.remaining) || parseInteger(timer.seconds) || 0),
      paused: false,
      remaining: null,
    };
  }

  return {
    ...timer,
    paused: true,
    remaining: remainingTimerSeconds(timer),
  };
}

function remainingTimerSeconds(timer) {
  if (!timer?.startedBy) return parseInteger(timer?.seconds) || 0;
  const startedAt = new Date(timer.startedAt).getTime();
  if (!Number.isFinite(startedAt)) return parseInteger(timer.seconds) || 0;
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, (parseInteger(timer.seconds) || 0) - elapsed);
}

async function addTeam(req, res) {
  const body = await readJson(req);
  const name = String(body.name || "").trim();
  if (!name) {
    sendJson(res, 400, { error: "Bitte einen Mannschaftsnamen eintragen." });
    return;
  }

  state.teams = normalizeTeams(state.teams);
  const duplicate = state.teams.find((team) => team.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    sendJson(res, 409, { error: "Diese Mannschaft gibt es bereits." });
    return;
  }

  const seen = new Set(state.teams.map((team) => team.id));
  state.teams.push({
    id: uniqueTeamId(String(body.id || crypto.randomUUID()), seen),
    name,
    maxScorers: clampScorerCount(body.maxScorers),
  });
  state = normalizeState(state);
  await persistState();
  broadcastState();
  sendJson(res, 200, { ok: true, state });
}

async function deleteTeam(req, res, id) {
  state.teams = normalizeTeams(state.teams);
  const team = state.teams.find((item) => item.id === id);
  if (!team) {
    sendJson(res, 404, { error: "Mannschaft nicht gefunden." });
    return;
  }
  if (state.athletes.some((athlete) => athlete.teamId === id)) {
    sendJson(res, 409, { error: "Diese Mannschaft enthält noch Athleten." });
    return;
  }
  state.teams = state.teams.filter((item) => item.id !== id);
  state = normalizeState(state);
  await persistState();
  broadcastState();
  sendJson(res, 200, { ok: true, state });
}

async function logoutJudge(req, res) {
  const body = await readJson(req);
  const role = getRoleForToken(body.token);
  if (role) {
    tokens.delete(body.token);
    judges[role] = null;
    state.meta.judgeConnections = sanitizeJudges();
    await persistState();
    broadcastSession();
    broadcastState();
  }
  sendJson(res, 200, { ok: true });
}

function getRoleForToken(token) {
  const role = tokens.get(String(token || ""));
  if (!role) return null;
  if (judges[role]?.token !== token) return null;
  return role;
}

function getRefereeCount() {
  return Number(state?.meta?.refereeCount) === 1 ? 1 : 3;
}

function getActiveRoleKeys() {
  return getRefereeCount() === 1 ? ["solo"] : ["left", "center", "right"];
}

function canControlAttempts(role) {
  return role === "solo" || role === "center";
}

function getRequiredGoodVotes() {
  return getRefereeCount() === 1 ? 1 : 2;
}

function ensureLiveKeys(key) {
  if (!state.meta.liveVotes || state.meta.liveVotes.key !== key) {
    state.meta.liveVotes = { key, votes: [null, null, null] };
  }
  if (!state.meta.liveTechnique || state.meta.liveTechnique.key !== key) {
    state.meta.liveTechnique = { key, points: [null, null, null] };
  }
}

function getCurrentAttempt() {
  return getQueue(state.meta.activeLift)[0] || null;
}

function getQueue(lift) {
  const groupId = state.meta.activeGroupId || firstPendingGroupId(lift);
  return athletesForGroup(groupId)
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

function getAttemptInfo(athlete, lift) {
  const attempts = athlete.attempts?.[lift] || [];
  if (attempts.length >= 3) return null;
  const attemptNo = attempts.length + 1;
  const weight = parseInteger(athlete.next?.[lift] || athlete.openers?.[lift]);
  if (!weight) return null;
  return {
    athlete,
    lift,
    attemptNo,
    weight,
    previousSequence: attempts.length ? attempts[attempts.length - 1].sequence : 0,
  };
}

function attemptKey(item) {
  return `${item.athlete.id}:${item.lift}:${item.attemptNo}`;
}

function attemptChangeKey(lift, attemptNo) {
  return `${lift}:${attemptNo}`;
}

function getAttemptChangeCount(athlete, lift, attemptNo) {
  const changes = athlete?.nextChangeCounts || {};
  return Math.max(0, parseInteger(changes[attemptChangeKey(lift, attemptNo)]) || 0);
}

function setAttemptChangeCount(athlete, lift, attemptNo, count) {
  athlete.nextChangeCounts = athlete.nextChangeCounts || {};
  athlete.nextChangeCounts[attemptChangeKey(lift, attemptNo)] = Math.min(Math.max(parseInteger(count) || 0, 0), MAX_WAITING_ROOM_CHANGES);
}

function setAttemptTimerForNext(previousAthleteId) {
  if (state.meta.mode !== "competition" || state.meta.breakPending) {
    state.meta.attemptTimer = null;
    return;
  }
  const next = getCurrentAttempt();
  if (!next) {
    state.meta.attemptTimer = null;
    return;
  }
  state.meta.attemptTimer = {
    startedAt: null,
    seconds: next.athlete.id === previousAthleteId ? 120 : 60,
    paused: true,
    remaining: next.athlete.id === previousAthleteId ? 120 : 60,
    startedBy: null,
    athleteId: next.athlete.id,
    key: attemptKey(next),
  };
}

function ensureAttemptTimerForCurrent(previousAthleteId = null) {
  if (state.meta.mode !== "competition" || state.meta.breakPending) {
    state.meta.attemptTimer = null;
    return;
  }

  const current = getCurrentAttempt();
  if (!current) {
    state.meta.attemptTimer = null;
    return;
  }

  const currentKey = attemptKey(current);
  const timer = state.meta.attemptTimer;
  if (timer?.seconds && timer.key === currentKey) return;

  setAttemptTimerForNext(previousAthleteId);
}

function firstPendingGroupId() {
  const group = getOrderedGroups().find(
    (item) => athletesForGroup(item.id).some((athlete) => !athlete.withdrawn) && !item.completed,
  );
  return group?.id || null;
}

function isGroupLiftComplete(group, lift) {
  if (!group) return false;
  if (lift === "cleanJerk" && group.cleanJerkCompleted) return true;
  if (lift !== "cleanJerk" && group.snatchCompleted) return true;
  const athletes = athletesForGroup(group.id).filter((athlete) => !athlete.withdrawn);
  return athletes.length > 0 && athletes.every((athlete) => (athlete.attempts?.[lift] || []).length >= 3);
}

function markGroupLiftComplete(group, lift) {
  if (!group) return;
  if (lift === "cleanJerk") {
    group.cleanJerkCompleted = true;
    group.completed = true;
  } else {
    group.snatchCompleted = true;
  }
}

function athletesForGroup(groupId) {
  const id = groupId || getOrderedGroups()[0]?.id || null;
  if (!id) return [];
  return state.athletes.filter((athlete) => getAthleteGroupId(athlete) === id);
}

function getAthleteGroupId(athlete) {
  return athlete?.groupId || getOrderedGroups()[0]?.id || "group-a";
}

function getOrderedGroups() {
  return [...(state.groups || [])].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return String(a.name).localeCompare(String(b.name), "de-DE", { numeric: true });
  });
}

function syncPhase() {
  if (state.meta.mode !== "competition") return;
  if (!state.meta.activeGroupId) state.meta.activeGroupId = firstPendingGroupId();

  const lift = state.meta.activeLift === "cleanJerk" ? "cleanJerk" : "snatch";
  if (!state.meta.activeGroupId) {
    state.meta.mode = lift === "snatch" ? "snatchComplete" : "finished";
    state.meta.breakPending = false;
    return;
  }

  if (getQueue(lift).length > 0) {
    ensureAttemptTimerForCurrent();
    return;
  }

  const activeGroup = state.groups.find((group) => group.id === state.meta.activeGroupId);
  markGroupLiftComplete(activeGroup, lift);
  state.meta.breakPending = false;
  if (lift === "snatch") state.meta.mode = "groupComplete";
  else state.meta.mode = firstPendingGroupId() ? "groupComplete" : "finished";
}

function attemptWeightWarning(athlete, lift, weight) {
  if (!Number.isInteger(weight) || weight < 1) return "Gewicht pruefen";
  const minimumWeight = minimumAttemptWeightForAthlete(athlete);
  if (weight < minimumWeight) {
    return state.meta.scoringMode === "IWF"
      ? `IWF-Mindestgewicht ${minimumWeight} kg`
      : `Mindestens Stangengewicht ${minimumWeight} kg`;
  }
  const best = bestWeight(athlete, lift);
  if (best && weight <= best) return `Nach gueltigem Versuch mindestens ${best + 1} kg`;
  return "";
}

function minimumAttemptWeightForAthlete(athlete) {
  if (state.meta.scoringMode === "IWF") {
    const iwfGender = athleteIwfGender(athlete);
    return IWF_MINIMUM_ATTEMPT_WEIGHT[iwfGender] || barWeightForAthlete(athlete);
  }
  return barWeightForAthlete(athlete);
}

function athleteIwfGender(athlete) {
  const category = getCategory(athlete?.gender, state.categories);
  if (category.relativeKey === "female" || category.weightClassType === "female") return "female";
  if (category.relativeKey === "male" || category.weightClassType === "male") return "male";
  return null;
}

function barWeightForAthlete(athlete) {
  const category = getCategory(athlete?.gender, state.categories);
  return Number(category.barWeight) || BAR_WEIGHTS[category.relativeKey] || 20;
}

function bestWeight(athlete, lift) {
  return Math.max(
    0,
    ...(athlete?.attempts?.[lift] || [])
      .filter((attempt) => attempt.good)
      .map((attempt) => Number(attempt.requestedWeight))
      .filter(Number.isFinite),
  );
}

function shouldUseTechnique(athlete) {
  if (state.meta.scoringMode === "IWF") return false;
  return Boolean(state.meta.childTechniqueEnabled) && Boolean(getCategory(athlete?.gender, state.categories).usesTechnique);
}

function calculateTechniqueScore(points) {
  const values = (points || []).map(Number).filter((point) => Number.isFinite(point));
  if (!values.length) return null;
  return Math.round((values.reduce((sum, point) => sum + point, 0) / values.length) * 10) / 10;
}

function openEventStream(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  CLIENTS.add(res);
  sendEvent(res, "state", state);
  sendEvent(res, "session", getSessionPayload(req));

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    CLIENTS.delete(res);
  });
}

function broadcastState() {
  for (const client of CLIENTS) sendEvent(client, "state", state);
}

function broadcastSession() {
  cleanupControlClients();
  cleanupDisplayClients();
  for (const client of CLIENTS) sendEvent(client, "session", getSessionPayload());
}

function sendEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function serveStatic(urlPath, res) {
  const fileName =
    urlPath === "/"
      ? "index.html"
      : urlPath === "/judge"
        ? "judge.html"
        : urlPath === "/tablet" || urlPath === "/warteraum"
          ? "tablet.html"
        : urlPath === "/waage"
          ? "weigh.html"
        : urlPath === "/display"
          ? "display.html"
        : urlPath === "/plates"
          ? "plates.html"
          : urlPath === "/scoreboard"
            ? "scoreboard.html"
            : urlPath === "/warteraum-anzeige" || urlPath === "/pi"
              ? "warteraum-display.html"
              : urlPath.replace(/^\/+/, "");
  const safePath = path.normalize(fileName).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { error: "Zugriff verweigert" });
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    sendJson(res, 404, { error: "Nicht gefunden" });
  }
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2_000_000) throw new Error("Request too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json;charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html;charset=utf-8" });
  res.end(html);
}

function defaultYoutubeConfig() {
  return {
    enabled: false,
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    accessToken: "",
    tokenExpiresAt: 0,
    privacyStatus: "unlisted",
    titleTemplate: "{event} - Livestream",
    cameraDeviceId: "",
    cameraLabel: "",
    microphoneDeviceId: "",
    microphoneLabel: "",
    ffmpegPath: "",
  };
}

function defaultYoutubeRuntime() {
  return {
    status: "idle",
    error: "",
    broadcastId: null,
    streamId: null,
    watchUrl: "",
    ffmpeg: null,
    stderr: "",
    chunkCount: 0,
    transitionStarted: false,
    startedAt: null,
  };
}

async function loadYoutubeConfig() {
  try {
    return normalizeYoutubeConfig(JSON.parse(await fs.readFile(YOUTUBE_SETTINGS_FILE, "utf8")));
  } catch (error) {
    return defaultYoutubeConfig();
  }
}

async function persistYoutubeConfig() {
  await fs.writeFile(YOUTUBE_SETTINGS_FILE, JSON.stringify(normalizeYoutubeConfig(youtubeConfig), null, 2), "utf8");
}

function normalizeYoutubeConfig(input = {}) {
  const base = defaultYoutubeConfig();
  const privacy = ["public", "unlisted", "private"].includes(input.privacyStatus)
    ? input.privacyStatus
    : base.privacyStatus;
  return {
    ...base,
    enabled: Boolean(input.enabled),
    clientId: String(input.clientId || "").trim(),
    clientSecret: String(input.clientSecret || ""),
    refreshToken: String(input.refreshToken || ""),
    accessToken: String(input.accessToken || ""),
    tokenExpiresAt: Number(input.tokenExpiresAt) || 0,
    privacyStatus: privacy,
    titleTemplate: String(input.titleTemplate || base.titleTemplate).trim() || base.titleTemplate,
    cameraDeviceId: String(input.cameraDeviceId || ""),
    cameraLabel: String(input.cameraLabel || ""),
    microphoneDeviceId: String(input.microphoneDeviceId || ""),
    microphoneLabel: String(input.microphoneLabel || ""),
    ffmpegPath: String(input.ffmpegPath || "").trim(),
  };
}

function getYoutubePayload() {
  const ffmpegPath = resolveFfmpegPath();
  return {
    connected: Boolean(youtubeConfig.refreshToken),
    status: youtubeRuntime.status,
    error: youtubeRuntime.error || "",
    watchUrl: youtubeRuntime.watchUrl || "",
    ffmpegFound: Boolean(ffmpegPath),
    ffmpegPath: ffmpegPath || "",
    settings: {
      enabled: Boolean(youtubeConfig.enabled),
      clientId: youtubeConfig.clientId,
      privacyStatus: youtubeConfig.privacyStatus,
      titleTemplate: youtubeConfig.titleTemplate,
      cameraDeviceId: youtubeConfig.cameraDeviceId,
      cameraLabel: youtubeConfig.cameraLabel,
      microphoneDeviceId: youtubeConfig.microphoneDeviceId,
      microphoneLabel: youtubeConfig.microphoneLabel,
      ffmpegPath: youtubeConfig.ffmpegPath,
    },
  };
}

async function updateYoutubeSettings(req, res) {
  const body = await readJson(req);
  const previousClientId = youtubeConfig.clientId;
  const next = normalizeYoutubeConfig({
    ...youtubeConfig,
    enabled: body.enabled,
    clientId: body.clientId,
    clientSecret: body.clientSecret ? String(body.clientSecret) : youtubeConfig.clientSecret,
    privacyStatus: body.privacyStatus,
    titleTemplate: body.titleTemplate,
    cameraDeviceId: body.cameraDeviceId,
    cameraLabel: body.cameraLabel,
    microphoneDeviceId: body.microphoneDeviceId,
    microphoneLabel: body.microphoneLabel,
    ffmpegPath: body.ffmpegPath,
  });
  if (previousClientId && previousClientId !== next.clientId) {
    next.refreshToken = "";
    next.accessToken = "";
    next.tokenExpiresAt = 0;
    youtubeRuntime.error = "YouTube Client-ID wurde geaendert. Bitte neu verbinden.";
    youtubeRuntime.status = "idle";
  }
  youtubeConfig = next;
  await persistYoutubeConfig();
  broadcastSession();
  sendJson(res, 200, { ok: true, youtube: getYoutubePayload() });
}

async function startYoutubeAuth(req, res) {
  const body = await readJson(req);
  if (body && Object.keys(body).length) {
    youtubeConfig = normalizeYoutubeConfig({
      ...youtubeConfig,
      ...body,
      clientSecret: body.clientSecret ? String(body.clientSecret) : youtubeConfig.clientSecret,
    });
    await persistYoutubeConfig();
  }
  if (!youtubeConfig.clientId) {
    sendJson(res, 400, { error: "Bitte zuerst die Google OAuth Client-ID eintragen." });
    return;
  }
  if (!youtubeConfig.clientSecret) {
    sendJson(res, 400, { error: "Bitte zuerst das Google OAuth Client Secret eintragen. Google verlangt es fuer diesen Desktop-Client." });
    return;
  }

  const verifier = base64Url(crypto.randomBytes(48));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  const stateCode = base64Url(crypto.randomBytes(24));
  youtubePendingOAuth = {
    state: stateCode,
    verifier,
    createdAt: Date.now(),
  };

  const params = new URLSearchParams({
    client_id: youtubeConfig.clientId,
    redirect_uri: youtubeRedirectUri(),
    response_type: "code",
    scope: YOUTUBE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: stateCode,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  sendJson(res, 200, { authUrl: `${YOUTUBE_AUTH_URL}?${params.toString()}`, redirectUri: youtubeRedirectUri() });
}

async function handleYoutubeOAuthCallback(url, res) {
  const error = url.searchParams.get("error");
  if (error) {
    sendHtml(res, 400, youtubeCallbackHtml("YouTube-Verbindung abgebrochen", escapeHtml(error), false));
    return;
  }

  const stateCode = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  if (!youtubePendingOAuth || youtubePendingOAuth.state !== stateCode || Date.now() - youtubePendingOAuth.createdAt > 10 * 60_000) {
    sendHtml(res, 400, youtubeCallbackHtml("YouTube-Verbindung fehlgeschlagen", "Die Anmeldung ist abgelaufen. Bitte im Programm neu starten.", false));
    return;
  }

  try {
    const tokens = await exchangeYoutubeCode(code, youtubePendingOAuth.verifier);
    youtubeConfig = normalizeYoutubeConfig({
      ...youtubeConfig,
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || youtubeConfig.refreshToken,
      tokenExpiresAt: Date.now() + (Number(tokens.expires_in) || 3600) * 1000,
    });
    youtubeRuntime.error = "";
    youtubeRuntime.status = youtubeRuntime.status === "error" ? "idle" : youtubeRuntime.status;
    youtubePendingOAuth = null;
    await persistYoutubeConfig();
    broadcastSession();
    sendHtml(res, 200, youtubeCallbackHtml("YouTube verbunden", "Dieses Fenster kann geschlossen werden. Die Verbindung ist im Programm aktiv.", true));
  } catch (authError) {
    sendHtml(res, 500, youtubeCallbackHtml("YouTube-Verbindung fehlgeschlagen", escapeHtml(authError.message), false));
  }
}

async function exchangeYoutubeCode(code, verifier) {
  const params = new URLSearchParams({
    client_id: youtubeConfig.clientId,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: youtubeRedirectUri(),
  });
  if (youtubeConfig.clientSecret) params.set("client_secret", youtubeConfig.clientSecret);
  const response = await fetch(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error_description || payload.error || "OAuth-Token konnte nicht gelesen werden.";
    if (String(message).toLowerCase().includes("client_secret")) {
      throw new Error("Google meldet: Client Secret fehlt oder ist falsch. Bitte Client Secret aus dem Google-OAuth-Client eintragen.");
    }
    throw new Error(message);
  }
  return payload;
}

async function getYoutubeAccessToken() {
  if (youtubeConfig.accessToken && youtubeConfig.tokenExpiresAt > Date.now() + 60_000) return youtubeConfig.accessToken;
  if (!youtubeConfig.refreshToken) throw new Error("YouTube ist noch nicht verbunden.");

  const params = new URLSearchParams({
    client_id: youtubeConfig.clientId,
    refresh_token: youtubeConfig.refreshToken,
    grant_type: "refresh_token",
  });
  if (youtubeConfig.clientSecret) params.set("client_secret", youtubeConfig.clientSecret);
  const response = await fetch(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error_description || payload.error || "YouTube-Zugriff konnte nicht erneuert werden.");
  youtubeConfig = normalizeYoutubeConfig({
    ...youtubeConfig,
    accessToken: payload.access_token || "",
    tokenExpiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
  });
  await persistYoutubeConfig();
  return youtubeConfig.accessToken;
}

async function youtubeApi(method, endpoint, query = {}, body = null) {
  const accessToken = await getYoutubeAccessToken();
  const url = new URL(`${YOUTUBE_API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  if (body !== null && body !== undefined) {
    options.headers["Content-Type"] = "application/json;charset=utf-8";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = { raw: text };
    }
  }
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.raw || `YouTube API Fehler ${response.status}`);
  }
  return payload;
}

async function startYoutubeLivestream(req, res) {
  const body = await readJson(req);
  if (!youtubeConfig.enabled) {
    sendJson(res, 200, { ok: true, skipped: true, youtube: getYoutubePayload() });
    return;
  }
  if (youtubeRuntime.status === "starting" || youtubeRuntime.status === "live") {
    sendJson(res, 200, { ok: true, alreadyLive: true, youtube: getYoutubePayload() });
    return;
  }
  if (!youtubeConfig.refreshToken) {
    youtubeRuntime.status = "error";
    youtubeRuntime.error = "YouTube ist noch nicht verbunden.";
    broadcastSession();
    sendJson(res, 400, { error: youtubeRuntime.error, youtube: getYoutubePayload() });
    return;
  }

  const ffmpegPath = resolveFfmpegPath();
  if (!ffmpegPath) {
    youtubeRuntime.status = "error";
    youtubeRuntime.error = "FFmpeg wurde nicht gefunden. Bitte ffmpeg.exe hinterlegen oder den Pfad eintragen.";
    broadcastSession();
    sendJson(res, 400, { error: youtubeRuntime.error, youtube: getYoutubePayload() });
    return;
  }

  try {
    youtubeRuntime = defaultYoutubeRuntime();
    youtubeRuntime.status = "starting";
    youtubeRuntime.startedAt = new Date().toISOString();
    broadcastSession();

    const title = formatYoutubeTitle(body);
    const broadcast = await youtubeApi(
      "POST",
      "/liveBroadcasts",
      { part: "snippet,status,contentDetails" },
      {
        snippet: {
          title,
          description: `Livestream ${state.meta.eventName || "Gewichtheben"}`,
          scheduledStartTime: new Date(Date.now() + 30_000).toISOString(),
        },
        status: {
          privacyStatus: youtubeConfig.privacyStatus,
          selfDeclaredMadeForKids: false,
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: false,
          monitorStream: { enableMonitorStream: false },
        },
      },
    );

    const stream = await youtubeApi(
      "POST",
      "/liveStreams",
      { part: "snippet,cdn" },
      {
        snippet: { title: `${title} Signal` },
        cdn: {
          frameRate: "30fps",
          ingestionType: "rtmp",
          resolution: "720p",
        },
      },
    );

    await youtubeApi("POST", "/liveBroadcasts/bind", { part: "id,contentDetails", id: broadcast.id, streamId: stream.id });

    const ingestion = stream?.cdn?.ingestionInfo || {};
    const ingestionAddress = ingestion.rtmpsIngestionAddress || ingestion.ingestionAddress;
    const streamName = ingestion.streamName;
    if (!ingestionAddress || !streamName) throw new Error("YouTube hat keine Stream-Adresse geliefert.");

    youtubeRuntime.broadcastId = broadcast.id;
    youtubeRuntime.streamId = stream.id;
    youtubeRuntime.watchUrl = `https://www.youtube.com/watch?v=${broadcast.id}`;
    youtubeRuntime.ffmpeg = spawnYoutubeFfmpeg(ffmpegPath, `${String(ingestionAddress).replace(/\/$/, "")}/${streamName}`);
    broadcastSession();
    sendJson(res, 200, { ok: true, youtube: getYoutubePayload() });
  } catch (error) {
    shutdownYoutubeFfmpeg();
    youtubeRuntime.status = "error";
    youtubeRuntime.error = error.message || "Livestream konnte nicht gestartet werden.";
    broadcastSession();
    sendJson(res, 500, { error: youtubeRuntime.error, youtube: getYoutubePayload() });
  }
}

async function receiveYoutubeMediaChunk(req, res) {
  const chunk = await readBinary(req, 25_000_000);
  if (!youtubeRuntime.ffmpeg || !youtubeRuntime.ffmpeg.stdin || youtubeRuntime.ffmpeg.stdin.destroyed) {
    sendJson(res, 409, { error: "Livestream-Encoder ist nicht bereit." });
    return;
  }
  try {
    await writeFfmpegStdin(chunk);
    youtubeRuntime.chunkCount += 1;
    if (!youtubeRuntime.transitionStarted) {
      youtubeRuntime.transitionStarted = true;
      transitionYoutubeBroadcastWhenReady().catch((error) => {
        youtubeRuntime.error = error.message;
        broadcastSession();
      });
    }
    sendJson(res, 200, { ok: true });
  } catch (error) {
    youtubeRuntime.status = "error";
    youtubeRuntime.error = error.message || "Videodaten konnten nicht an FFmpeg gesendet werden.";
    broadcastSession();
    sendJson(res, 500, { error: youtubeRuntime.error });
  }
}

async function stopYoutubeLivestream(req, res) {
  await readJson(req).catch(() => ({}));
  if (!["starting", "live", "stopping", "error"].includes(youtubeRuntime.status)) {
    sendJson(res, 200, { ok: true, youtube: getYoutubePayload() });
    return;
  }

  youtubeRuntime.status = "stopping";
  broadcastSession();
  let stopError = "";
  try {
    if (youtubeRuntime.broadcastId) {
      await youtubeApi("POST", "/liveBroadcasts/transition", {
        part: "status",
        id: youtubeRuntime.broadcastId,
        broadcastStatus: "complete",
      });
    }
  } catch (error) {
    stopError = error.message || "YouTube konnte nicht auf beendet gesetzt werden.";
  }
  shutdownYoutubeFfmpeg();
  youtubeRuntime.status = stopError ? "error" : "complete";
  youtubeRuntime.error = stopError;
  broadcastSession();
  sendJson(res, stopError ? 500 : 200, { ok: !stopError, error: stopError, youtube: getYoutubePayload() });
}

async function transitionYoutubeBroadcastWhenReady() {
  if (!youtubeRuntime.broadcastId || !youtubeRuntime.streamId) return;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await delay(3000);
    if (!["starting", "live"].includes(youtubeRuntime.status)) return;
    const streamStatus = await youtubeApi("GET", "/liveStreams", { part: "status", id: youtubeRuntime.streamId });
    const value = streamStatus?.items?.[0]?.status?.streamStatus || "";
    if (value === "active") {
      try {
        await youtubeApi("POST", "/liveBroadcasts/transition", {
          part: "status",
          id: youtubeRuntime.broadcastId,
          broadcastStatus: "live",
        });
      } catch (error) {
        try {
          await youtubeApi("POST", "/liveBroadcasts/transition", {
            part: "status",
            id: youtubeRuntime.broadcastId,
            broadcastStatus: "testing",
          });
          await delay(2000);
          await youtubeApi("POST", "/liveBroadcasts/transition", {
            part: "status",
            id: youtubeRuntime.broadcastId,
            broadcastStatus: "live",
          });
        } catch (transitionError) {
          youtubeRuntime.error = transitionError.message || error.message;
          broadcastSession();
          return;
        }
      }
      youtubeRuntime.status = "live";
      youtubeRuntime.error = "";
      broadcastSession();
      return;
    }
  }
  youtubeRuntime.error = "YouTube meldet noch kein aktives Videosignal. Bitte Kamera, FFmpeg und Internetverbindung pruefen.";
  broadcastSession();
}

function spawnYoutubeFfmpeg(ffmpegPath, targetUrl) {
  const args = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-re",
    "-f",
    "webm",
    "-i",
    "pipe:0",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-tune",
    "zerolatency",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-g",
    "60",
    "-b:v",
    "2500k",
    "-maxrate",
    "2500k",
    "-bufsize",
    "5000k",
    "-c:a",
    "aac",
    "-ar",
    "44100",
    "-b:a",
    "128k",
    "-f",
    "flv",
    targetUrl,
  ];
  const child = spawn(ffmpegPath, args, { stdio: ["pipe", "ignore", "pipe"], windowsHide: true });
  child.stderr.on("data", (data) => {
    youtubeRuntime.stderr = `${youtubeRuntime.stderr || ""}${data.toString("utf8")}`.slice(-6000);
  });
  child.on("exit", (code) => {
    if (["starting", "live", "stopping"].includes(youtubeRuntime.status)) {
      youtubeRuntime.status = code === 0 || youtubeRuntime.status === "stopping" ? youtubeRuntime.status : "error";
      if (code !== 0 && youtubeRuntime.status === "error") {
        youtubeRuntime.error = `FFmpeg wurde beendet (${code}). ${youtubeRuntime.stderr || ""}`.trim();
      }
      broadcastSession();
    }
  });
  return child;
}

function shutdownYoutubeFfmpeg() {
  const child = youtubeRuntime.ffmpeg;
  youtubeRuntime.ffmpeg = null;
  if (!child) return;
  try {
    if (child.stdin && !child.stdin.destroyed) child.stdin.end();
  } catch (error) {
    // best effort
  }
  setTimeout(() => {
    try {
      if (!child.killed) child.kill("SIGTERM");
    } catch (error) {
      // best effort
    }
  }, 1000);
}

function writeFfmpegStdin(chunk) {
  return new Promise((resolve, reject) => {
    const stdin = youtubeRuntime.ffmpeg?.stdin;
    if (!stdin || stdin.destroyed) {
      reject(new Error("FFmpeg ist nicht bereit."));
      return;
    }
    const ok = stdin.write(chunk, (error) => {
      if (error) reject(error);
    });
    if (ok) {
      resolve();
      return;
    }
    stdin.once("drain", resolve);
    stdin.once("error", reject);
  });
}

function resolveFfmpegPath() {
  const candidates = [
    youtubeConfig.ffmpegPath,
    path.join(ROOT, "runtime", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"),
    path.join(ROOT, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fsSync.existsSync(candidate)) return candidate;
  }
  const command = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(command, ["ffmpeg"], { encoding: "utf8", windowsHide: true });
  if (result.status === 0) {
    const first = String(result.stdout || "").split(/\r?\n/).find(Boolean);
    if (first && fsSync.existsSync(first.trim())) return first.trim();
  }
  return "";
}

function formatYoutubeTitle(body = {}) {
  const template = youtubeConfig.titleTemplate || "{event} - Livestream";
  const replacements = {
    event: body.eventName || state.meta.eventName || "Gewichtheben",
    category: body.category || state.meta.category || "",
    platform: body.platform || state.meta.group || "",
    date: new Date().toLocaleDateString("de-DE"),
  };
  return template.replace(/\{(event|category|platform|date)\}/g, (_, key) => replacements[key] || "").replace(/\s+/g, " ").trim();
}

function youtubeRedirectUri() {
  return `http://127.0.0.1:${PORT}/api/youtube/oauth-callback`;
}

function youtubeCallbackHtml(title, message, closeWindow) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef3f5; color: #111820; }
    main { max-width: 560px; padding: 30px; border: 1px solid #d5e0e6; border-radius: 12px; background: white; box-shadow: 0 20px 60px rgba(20, 40, 60, .12); }
    h1 { margin: 0 0 12px; font-size: 28px; }
    p { margin: 0; color: #5b6b78; font-size: 18px; line-height: 1.45; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>${message}</p>
  </main>
  ${closeWindow ? "<script>setTimeout(() => window.close(), 2500);</script>" : ""}
</body>
</html>`;
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readBinary(req, maxSize) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxSize) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function loadState() {
  try {
    return normalizeState(JSON.parse(await fs.readFile(DATA_FILE, "utf8")));
  } catch (error) {
    return defaultState();
  }
}

async function persistState() {
  const serialized = JSON.stringify(state, null, 2);
  await fs.writeFile(DATA_FILE, serialized, "utf8");
  await createBackupSnapshot(serialized).catch((error) => {
    console.error("Backup konnte nicht geschrieben werden:", error.message);
  });
}

async function createBackupSnapshot(serialized = JSON.stringify(state, null, 2)) {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sequence = Number(state?.meta?.sequence) || 0;
  const suffix = crypto.randomBytes(2).toString("hex");
  const fileName = `backup-${stamp}-seq${sequence}-${suffix}.json`;
  await fs.writeFile(path.join(BACKUP_DIR, fileName), serialized, "utf8");
  await fs.writeFile(path.join(BACKUP_DIR, LATEST_BACKUP_FILE), serialized, "utf8");
  await pruneBackups();
}

async function pruneBackups() {
  const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true }).catch(() => []);
  const backups = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isBackupFileName(entry.name) || entry.name === LATEST_BACKUP_FILE) continue;
    const fullPath = path.join(BACKUP_DIR, entry.name);
    const stats = await fs.stat(fullPath).catch(() => null);
    if (stats) backups.push({ name: entry.name, mtimeMs: stats.mtimeMs });
  }
  backups.sort((a, b) => b.mtimeMs - a.mtimeMs);
  await Promise.all(
    backups.slice(MAX_BACKUPS).map((backup) =>
      fs.rm(path.join(BACKUP_DIR, backup.name), { force: true }).catch(() => {}),
    ),
  );
}

async function listBackups(req, res) {
  const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true }).catch(() => []);
  const summaries = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isBackupFileName(entry.name)) continue;
    if (entry.name === LATEST_BACKUP_FILE) continue;
    const fullPath = path.join(BACKUP_DIR, entry.name);
    const stats = await fs.stat(fullPath).catch(() => null);
    const summary = await summarizeBackup(fullPath, entry.name, stats);
    if (summary) summaries.push(summary);
  }
  summaries.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const latest = await summarizeBackup(path.join(BACKUP_DIR, LATEST_BACKUP_FILE), LATEST_BACKUP_FILE, null);
  sendJson(res, 200, { backups: summaries, latest });
}

async function restoreBackup(req, res) {
  const body = await readJson(req);
  const fileName = normalizeBackupFileName(body.file || LATEST_BACKUP_FILE);
  if (!fileName) {
    sendJson(res, 400, { error: "Ungültige Sicherung." });
    return;
  }

  try {
    const backupState = JSON.parse(await fs.readFile(path.join(BACKUP_DIR, fileName), "utf8"));
    state = normalizeState(backupState);
    syncPhase();
    await persistState();
    broadcastSession();
    broadcastState();
    sendJson(res, 200, { ok: true, state });
  } catch (error) {
    sendJson(res, 404, { error: "Sicherung konnte nicht geladen werden." });
  }
}

async function summarizeBackup(fullPath, fileName, stats = null) {
  try {
    const raw = await fs.readFile(fullPath, "utf8");
    const backupState = normalizeState(JSON.parse(raw));
    const fileStats = stats || (await fs.stat(fullPath).catch(() => null));
    return {
      file: fileName,
      createdAt: backupCreatedAt(fileName, fileStats),
      modifiedAt: fileStats ? new Date(fileStats.mtimeMs).toISOString() : null,
      eventName: backupState.meta.eventName || "Wettkampf",
      category: backupState.meta.category || "",
      mode: backupState.meta.mode || "setup",
      activeLift: backupState.meta.activeLift || "snatch",
      groupName: groupNameById(backupState.meta.activeGroupId, backupState),
      sequence: Number(backupState.meta.sequence) || 0,
      attempts: countStateAttempts(backupState),
      athletes: Array.isArray(backupState.athletes) ? backupState.athletes.length : 0,
    };
  } catch (error) {
    return null;
  }
}

function normalizeBackupFileName(value) {
  const fileName = path.basename(String(value || ""));
  return isBackupFileName(fileName) ? fileName : null;
}

function isBackupFileName(fileName) {
  return fileName === LATEST_BACKUP_FILE || /^backup-[A-Za-z0-9._-]+\.json$/.test(fileName);
}

function backupCreatedAt(fileName, stats) {
  const match = String(fileName).match(/^backup-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z-/);
  if (match) return `${match[1]}T${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`;
  return stats ? new Date(stats.mtimeMs).toISOString() : null;
}

function countStateAttempts(source) {
  return (source.athletes || []).reduce(
    (sum, athlete) =>
      sum + (athlete.attempts?.snatch || []).length + (athlete.attempts?.cleanJerk || []).length,
    0,
  );
}

function hasAnyRecordedAttempt(athlete) {
  return Boolean((athlete?.attempts?.snatch || []).length || (athlete?.attempts?.cleanJerk || []).length);
}

function weighDataLockReason(athlete) {
  if (!athlete) return "Athlet nicht gefunden.";
  if (athlete.withdrawn) return "Athlet ist als fehlend markiert.";
  if (hasAnyRecordedAttempt(athlete)) return "Athlet hat bereits Versuche im Wettkampf.";
  if (state.meta.mode !== "setup" && state.meta.activeGroupId && getAthleteGroupId(athlete) === state.meta.activeGroupId) {
    return "Die aktuell laufende Gruppe ist an der Waage gesperrt.";
  }
  return "";
}

function groupNameById(id, source = state) {
  const group = (source.groups || []).find((item) => item.id === id);
  return group?.name || "";
}

function defaultState() {
  return {
    meta: {
      eventName: "",
      category: "",
      group: "A",
      mode: "setup",
      activeLift: "snatch",
      activeGroupId: null,
      refereeCount: 3,
      scoringMode: "CLUB",
      childTechniqueEnabled: false,
      sequence: 0,
      breakPending: false,
      startedAt: null,
      liveVotes: { key: null, votes: [null, null, null] },
      liveTechnique: { key: null, points: [null, null, null] },
      attemptTimer: null,
      judgeConnections: { solo: null, left: null, center: null, right: null },
      displayAssignments: {},
    },
    groups: [{ ...DEFAULT_GROUP }],
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    relativeTables: {},
    ageFactors: createDefaultAgeFactors(),
    plates: DEFAULT_PLATES.map((plate) => ({ ...plate })),
    teams: [],
    athletes: [],
  };
}

function normalizeState(input) {
  const base = defaultState();
  const next = {
    meta: { ...base.meta, ...(input?.meta || {}) },
    groups: ensureAtLeastOneGroup(
      collapseGeneratedDefaultGroups(Array.isArray(input?.groups) && input.groups.length ? input.groups : base.groups, input),
    ),
    categories: normalizeCategories(input?.categories || base.categories),
    relativeTables: normalizeRelativeTables(input?.relativeTables || base.relativeTables),
    ageFactors: normalizeAgeFactors(input?.ageFactors || base.ageFactors),
    plates: normalizePlates(input?.plates || base.plates),
    teams: normalizeTeams(input?.teams || base.teams),
    athletes: Array.isArray(input?.athletes) ? input.athletes : [],
  };

  next.meta.liveVotes = {
    key: input?.meta?.liveVotes?.key || null,
    votes: Array.isArray(input?.meta?.liveVotes?.votes)
      ? [0, 1, 2].map((index) =>
          typeof input.meta.liveVotes.votes[index] === "boolean" ? input.meta.liveVotes.votes[index] : null,
        )
      : [null, null, null],
  };
  next.meta.liveTechnique = {
    key: input?.meta?.liveTechnique?.key || null,
    points: Array.isArray(input?.meta?.liveTechnique?.points)
      ? [0, 1, 2].map((index) => {
          const raw = input.meta.liveTechnique.points[index];
          if (raw === null || raw === undefined || raw === "") return null;
          const point = Number(raw);
          return Number.isFinite(point) ? point : null;
        })
      : [null, null, null],
  };
  next.meta.attemptTimer =
    input?.meta?.attemptTimer && Number(input.meta.attemptTimer.seconds) > 0
      ? {
          startedAt: input.meta.attemptTimer.startedAt || null,
          seconds: parseInteger(input.meta.attemptTimer.seconds) || 60,
          paused: Boolean(input.meta.attemptTimer.paused),
          remaining:
            input.meta.attemptTimer.remaining === null || input.meta.attemptTimer.remaining === undefined
              ? null
              : Math.max(0, parseInteger(input.meta.attemptTimer.remaining) || 0),
          startedBy: canControlAttempts(input.meta.attemptTimer.startedBy) ? input.meta.attemptTimer.startedBy : null,
          athleteId: input.meta.attemptTimer.athleteId || null,
          key: input.meta.attemptTimer.key || null,
        }
      : null;
  next.meta.judgeConnections = {
    ...base.meta.judgeConnections,
    ...(input?.meta?.judgeConnections || {}),
    ...sanitizeJudges(),
  };
  next.meta.refereeCount = Number(next.meta.refereeCount) === 1 ? 1 : 3;
  next.meta.scoringMode = next.meta.scoringMode === "IWF" ? "IWF" : "CLUB";
  if (next.meta.scoringMode === "IWF") next.meta.refereeCount = 3;
  next.meta.childTechniqueEnabled = Boolean(next.meta.childTechniqueEnabled);
  next.meta.displayAssignments = normalizeDisplayAssignments(input?.meta?.displayAssignments || {});
  if (next.meta.scoringMode === "IWF") next.meta.judgeConnections.solo = null;

  next.groups = ensureAtLeastOneGroup(next.groups)
    .map((group, index) => ({
      id: String(group.id || crypto.randomUUID()),
      name: String(group.name || String.fromCharCode(65 + index)),
      order: parseInteger(group.order) || index + 1,
      completed: Boolean(group.completed),
      snatchCompleted: Boolean(group.snatchCompleted),
      cleanJerkCompleted: Boolean(group.cleanJerkCompleted || group.completed),
    }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.name).localeCompare(String(b.name), "de-DE", { numeric: true });
    });
  if (!next.groups.length) next.groups = [{ ...DEFAULT_GROUP }];
  const groupIds = new Set(next.groups.map((group) => group.id));
  const fallbackGroupId = next.groups[0].id;
  const teamIds = new Set(next.teams.map((team) => team.id));

  next.athletes = next.athletes.map((athlete, index) => {
    const openers = {
      snatch: parseInteger(athlete.openers?.snatch),
      cleanJerk: parseInteger(athlete.openers?.cleanJerk),
    };
    const gender = normalizeGender(athlete.gender, next.categories);
    const ageClass = normalizeAgeClass(athlete.ageClass);
    const weightOptions = getWeightClassOptions(gender, ageClass, next.categories);
    const weightClass =
      athlete.weightClass && weightOptions.includes(String(athlete.weightClass))
        ? String(athlete.weightClass)
        : weightOptions[0] || "";
    return {
      id: athlete.id || crypto.randomUUID(),
      name: String(athlete.name || `Athlet ${index + 1}`),
      team: String(athlete.team || ""),
      teamId: teamIds.has(athlete.teamId) ? athlete.teamId : "",
      startNo: parseInteger(athlete.startNo) || index + 1,
      groupId: groupIds.has(athlete.groupId) ? athlete.groupId : fallbackGroupId,
      gender,
      ageClass,
      birthYear: parseOptionalBirthYear(athlete.birthYear),
      weightClass,
      barWeight: parseFloatSafe(athlete.barWeight) || getCategory(gender, next.categories).barWeight,
      lotNo: parseInteger(athlete.lotNo) || parseInteger(athlete.startNo) || index + 1,
      bodyweight: parseFloatSafe(athlete.bodyweight),
      entryTotal: parseInteger(athlete.entryTotal),
      openers,
      next: {
        snatch: parseInteger(athlete.next?.snatch) || openers.snatch || null,
        cleanJerk: parseInteger(athlete.next?.cleanJerk) || openers.cleanJerk || null,
      },
      nextChangeCounts: normalizeNextChangeCounts(athlete.nextChangeCounts),
      attempts: {
        snatch: normalizeAttempts(athlete.attempts?.snatch),
        cleanJerk: normalizeAttempts(athlete.attempts?.cleanJerk),
      },
      withdrawn: Boolean(athlete.withdrawn),
    };
  });

  if (!groupIds.has(next.meta.activeGroupId)) {
    next.meta.activeGroupId = next.meta.mode === "setup" ? null : fallbackGroupId;
  }

  return next;
}

function ensureAtLeastOneGroup(groups) {
  return Array.isArray(groups) && groups.length ? [...groups] : [{ ...DEFAULT_GROUP }];
}

function collapseGeneratedDefaultGroups(groups, input) {
  if (!Array.isArray(groups) || groups.length !== 8) return groups;
  const athletes = Array.isArray(input?.athletes) ? input.athletes : [];
  const hasAthletesOutsideGroupA = athletes.some((athlete) => athlete.groupId && athlete.groupId !== "group-a");
  if (hasAthletesOutsideGroupA) return groups;
  const oldDefaults = Array.from({ length: 8 }, (_, index) => {
    const name = String.fromCharCode(65 + index);
    return { id: `group-${name.toLowerCase()}`, name, order: index + 1 };
  });
  const isOldDefaultSet = oldDefaults.every((defaultGroup) =>
    groups.some(
      (group) =>
        group.id === defaultGroup.id &&
        String(group.name) === defaultGroup.name &&
        Number(group.order) === defaultGroup.order,
    ),
  );
  return isOldDefaultSet ? [{ ...DEFAULT_GROUP }] : groups;
}

function normalizeTeams(input) {
  const rows = Array.isArray(input) ? input : [];
  const seen = new Set();
  return rows
    .map((team, index) => {
      const fallbackName = team?.name || `Mannschaft ${index + 1}`;
      const rawId = String(team?.id || slugifyId(fallbackName) || `team-${index + 1}`);
      const id = uniqueTeamId(rawId, seen);
      return {
        id,
        name: String(fallbackName).trim() || `Mannschaft ${index + 1}`,
        maxScorers: clampScorerCount(team?.maxScorers),
      };
    })
    .filter((team) => team.name);
}

function uniqueTeamId(rawId, seen) {
  const base = slugifyId(rawId) || "team";
  let id = base;
  let counter = 2;
  while (seen.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  seen.add(id);
  return id;
}

function slugifyId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clampScorerCount(value) {
  const number = parseInteger(value) || 6;
  return Math.min(Math.max(number, 1), 10);
}

function normalizeGender(value, categories = DEFAULT_CATEGORIES) {
  const normalized = String(value || "").trim().toLowerCase();
  const rows = Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORIES;
  const direct = rows.find((category) => String(category.id).toLowerCase() === normalized);
  if (direct) return direct.id;
  const byLabel = rows.find((category) => String(category.label).trim().toLowerCase() === normalized);
  if (byLabel) return byLabel.id;
  const fallback =
    normalized === "female" || normalized === "woman" || normalized === "w" || normalized === "frau"
      ? "female"
      : normalized === "child" || normalized === "kid" || normalized === "kind"
        ? "child"
        : "male";
  return rows.some((category) => category.id === fallback) ? fallback : rows[0]?.id || "male";
}

function getCategory(value, categories = state?.categories || DEFAULT_CATEGORIES) {
  const rows = Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORIES;
  const id = normalizeGender(value, rows);
  return rows.find((category) => category.id === id) || rows[0] || DEFAULT_CATEGORIES[0];
}

function normalizeCategories(input) {
  const rows = Array.isArray(input) ? input : DEFAULT_CATEGORIES;
  const seen = new Set();
  const normalized = rows
    .map((category, index) => {
      const fallback = DEFAULT_CATEGORIES[index] || DEFAULT_CATEGORIES[0];
      const id = uniqueCategoryId(String(category.id || category.label || fallback.id), seen);
      const weightClassType = ["male", "female", "child"].includes(category.weightClassType)
        ? category.weightClassType
        : fallback.weightClassType;
      const relativeKey = Object.keys(BAR_WEIGHTS).includes(category.relativeKey) ? category.relativeKey : fallback.relativeKey;
      return {
        id,
        label: String(category.label || fallback.label || id),
        barWeight: parseFloatSafe(category.barWeight) || fallback.barWeight || 20,
        weightClassType,
        relativeKey,
        usesTechnique: Boolean(category.usesTechnique),
        includeCollars:
          category.includeCollars === undefined
            ? Boolean(fallback.includeCollars)
            : Boolean(category.includeCollars),
      };
    })
    .filter((category) => category.label.trim());
  return normalized.length ? normalized : DEFAULT_CATEGORIES.map((category) => ({ ...category }));
}

function uniqueCategoryId(rawId, seen) {
  const base =
    String(rawId || "category")
      .toLowerCase()
      .trim()
      .replaceAll("ä", "ae")
      .replaceAll("ö", "oe")
      .replaceAll("ü", "ue")
      .replaceAll("ß", "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "category";
  let id = base;
  let counter = 2;
  while (seen.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  seen.add(id);
  return id;
}

function normalizeAgeClass(value) {
  const key = String(value || "").trim();
  return AGE_CLASSES.has(key) ? key : "senior";
}

function weightTypeForAgeClass(value) {
  const key = normalizeAgeClass(value);
  if (key === "children" || key === "school") return "child";
  if (key === "youth") return "youth";
  return "senior";
}

function getWeightClassOptions(gender, ageClass, categories = state?.categories || DEFAULT_CATEGORIES) {
  const category = getCategory(gender, categories);
  const weightClassType = category.weightClassType || "male";
  const weightType = weightClassType === "child" ? "child" : weightTypeForAgeClass(ageClass);
  if (weightType === "child") return WEIGHT_CLASSES.child.child;
  const genderKey = weightClassType === "female" ? "female" : "male";
  return WEIGHT_CLASSES[weightType]?.[genderKey] || WEIGHT_CLASSES.senior[genderKey];
}

function normalizePlates(input) {
  const rows = Array.isArray(input) ? input : DEFAULT_PLATES;
  const shouldMigrateDefaults = rows.some((plate) => plate.id === "plate-1-25" || Number(plate.weight) === 1.25);
  let normalized = rows
    .map((plate, index) => ({
      id: String(plate.id || `plate-${index + 1}`),
      weight: parseFloatSafe(plate.weight),
      color: normalizePlateColor(plate.color),
      size: parseInteger(plate.size) || parseInteger(plate.height) || 120,
    }))
    .filter((plate) => Number.isFinite(plate.weight) && plate.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  normalized = normalized
    .filter((plate) => plate.id !== "plate-1-25" && plate.weight !== 1.25)
    .map((plate) =>
      plate.weight === 2.5 && plate.color.toLowerCase() === "#161b20"
        ? { ...plate, color: "#f28c28" }
        : plate,
    );
  if (shouldMigrateDefaults) {
    const weights = new Set(normalized.map((plate) => Number(plate.weight)));
    DEFAULT_PLATES.forEach((plate) => {
      if (!weights.has(Number(plate.weight))) normalized.push({ ...plate });
    });
  }
  normalized.sort((a, b) => b.weight - a.weight);
  return normalized.length ? normalized : DEFAULT_PLATES.map((plate) => ({ ...plate }));
}

function normalizePlateColor(value) {
  const text = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text;
  return "#8d98a3";
}

function normalizeRelativeTables(input) {
  const output = {};
  for (const key of Object.keys(BAR_WEIGHTS)) {
    const rows = Array.isArray(input?.[key]) ? input[key] : [];
    output[key] = rows
      .map((row) => ({
        bodyweight: parseFloatSafe(row.bodyweight),
        deduction: parseFloatSafe(row.deduction),
      }))
      .filter((row) => Number.isFinite(row.bodyweight) && Number.isFinite(row.deduction))
      .sort((a, b) => a.bodyweight - b.bodyweight);
  }
  return output;
}

function createDefaultAgeFactors() {
  const fromValues = (values) =>
    values
      .split(",")
      .map((item) => {
        const [age, factor] = item.split(":").map(Number);
        return { age, factor };
      })
      .filter((row) => Number.isFinite(row.age) && Number.isFinite(row.factor));
  return {
    male: fromValues(DEFAULT_AGE_FACTOR_VALUES.male),
    female: fromValues(DEFAULT_AGE_FACTOR_VALUES.female),
  };
}

function normalizeAgeFactors(input) {
  const defaults = createDefaultAgeFactors();
  const output = {};
  for (const key of ["male", "female"]) {
    const rows = Array.isArray(input?.[key]) ? input[key] : defaults[key];
    const normalizedRows = rows
      .map((row) => ({
        age: parseInteger(row.age),
        factor: parseFloatSafe(row.factor),
      }))
      .filter((row) => Number.isFinite(row.age) && Number.isFinite(row.factor) && row.age >= 0 && row.factor > 0)
      .sort((a, b) => a.age - b.age);
    output[key] = isLegacyNeutralAgeFactorTable(normalizedRows)
      ? defaults[key].map((row) => ({ ...row }))
      : normalizedRows;
    if (!output[key].length) output[key] = defaults[key].map((row) => ({ ...row }));
  }
  return output;
}

function isLegacyNeutralAgeFactorTable(rows) {
  return (
    rows.length >= 50 &&
    rows.some((row) => row.age === DEFAULT_AGE_FACTOR_START_AGE) &&
    rows.every((row) => row.factor === 1)
  );
}

function normalizeAttempts(attempts) {
  if (!Array.isArray(attempts)) return [];
  return attempts.map((attempt) => ({
    ...attempt,
    techniquePoints: Array.isArray(attempt.techniquePoints)
      ? [0, 1, 2].map((index) => {
          const raw = attempt.techniquePoints[index];
          if (raw === null || raw === undefined || raw === "") return null;
          const point = Number(raw);
          return Number.isFinite(point) ? point : null;
        })
      : [],
    techniqueScore:
      attempt.techniqueScore === null || attempt.techniqueScore === undefined
        ? null
        : parseFloatSafe(attempt.techniqueScore),
  }));
}

function normalizeNextChangeCounts(input) {
  const output = {};
  if (!input || typeof input !== "object") return output;
  for (const [key, value] of Object.entries(input)) {
    if (!/^(snatch|cleanJerk):[123]$/.test(key)) continue;
    output[key] = Math.min(Math.max(parseInteger(value) || 0, 0), MAX_WAITING_ROOM_CHANGES);
  }
  return output;
}

function sanitizeJudges() {
  return {
    solo: sanitizeJudge(judges.solo),
    left: sanitizeJudge(judges.left),
    center: sanitizeJudge(judges.center),
    right: sanitizeJudge(judges.right),
  };
}

function sanitizeJudge(judge) {
  if (!judge) return null;
  return {
    name: judge.name,
    role: judge.role,
    connectedAt: judge.connectedAt,
  };
}

function clearJudges() {
  tokens.clear();
  judges.solo = null;
  judges.left = null;
  judges.center = null;
  judges.right = null;
}

function sanitizeControlClients() {
  cleanupControlClients();
  const byIdentity = new Map();
  for (const client of [...CONTROL_CLIENTS.values()].sort((a, b) => String(a.connectedAt).localeCompare(String(b.connectedAt)))) {
    const identity = controlClientIdentity(client);
    const existing = byIdentity.get(identity);
    if (!existing) {
      byIdentity.set(identity, {
        id: client.token,
        ids: [client.token],
        name: client.name,
        address: client.address,
        isLocal: client.isLocal,
        identity,
        connectedAt: client.connectedAt,
        lastSeen: client.lastSeen,
      });
      continue;
    }

    existing.ids.push(client.token);
    if (new Date(client.lastSeen).getTime() > new Date(existing.lastSeen).getTime()) {
      existing.lastSeen = client.lastSeen;
      existing.id = client.token;
      existing.name = client.name;
      existing.address = client.address;
    }
  }

  return [...byIdentity.values()].sort((a, b) => {
    if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
    return String(a.connectedAt).localeCompare(String(b.connectedAt));
  });
}

function sanitizeTabletClients() {
  cleanupTabletClients();
  return [...TABLET_CLIENTS.values()]
    .sort((a, b) => String(a.connectedAt).localeCompare(String(b.connectedAt)))
    .map((client) => ({
      id: client.token,
      name: client.name,
      address: client.address,
      connectedAt: client.connectedAt,
      lastSeen: client.lastSeen,
    }));
}

function sanitizeWeighClients() {
  cleanupWeighClients();
  return [...WEIGH_CLIENTS.values()]
    .sort((a, b) => String(a.connectedAt).localeCompare(String(b.connectedAt)))
    .map((client) => ({
      id: client.token,
      name: client.name,
      address: client.address,
      connectedAt: client.connectedAt,
      lastSeen: client.lastSeen,
    }));
}

function sanitizeDisplayClients() {
  cleanupDisplayClients();
  return [...DISPLAY_CLIENTS.values()]
    .sort((a, b) => String(a.connectedAt).localeCompare(String(b.connectedAt)))
    .map((client) => ({
      id: client.token,
      name: client.name,
      address: client.address,
      assignment: getDisplayAssignment(client.token),
      connectedAt: client.connectedAt,
      lastSeen: client.lastSeen,
    }));
}

function cleanupControlClients() {
  const now = Date.now();
  for (const [token, client] of CONTROL_CLIENTS.entries()) {
    const lastSeen = new Date(client.lastSeen).getTime();
    if (!Number.isFinite(lastSeen) || now - lastSeen > CONTROL_CLIENT_TIMEOUT_MS) {
      CONTROL_CLIENTS.delete(token);
    }
  }
}

function cleanupTabletClients() {
  const now = Date.now();
  for (const [token, client] of TABLET_CLIENTS.entries()) {
    const lastSeen = new Date(client.lastSeen).getTime();
    if (!Number.isFinite(lastSeen) || now - lastSeen > TABLET_CLIENT_TIMEOUT_MS) {
      TABLET_CLIENTS.delete(token);
    }
  }
}

function cleanupWeighClients() {
  const now = Date.now();
  for (const [token, client] of WEIGH_CLIENTS.entries()) {
    const lastSeen = new Date(client.lastSeen).getTime();
    if (!Number.isFinite(lastSeen) || now - lastSeen > WEIGH_CLIENT_TIMEOUT_MS) {
      WEIGH_CLIENTS.delete(token);
    }
  }
}

function cleanupDisplayClients() {
  const now = Date.now();
  for (const [token, client] of DISPLAY_CLIENTS.entries()) {
    const lastSeen = new Date(client.lastSeen).getTime();
    if (!Number.isFinite(lastSeen) || now - lastSeen > DISPLAY_CLIENT_TIMEOUT_MS) {
      DISPLAY_CLIENTS.delete(token);
    }
  }
}

function getTabletForToken(token) {
  const tablet = TABLET_CLIENTS.get(String(token || ""));
  if (!tablet) return null;
  return tablet;
}

function getWeighClientForToken(token) {
  const client = WEIGH_CLIENTS.get(String(token || ""));
  if (!client) return null;
  return client;
}

function defaultControlClientName(req) {
  const address = getRemoteAddress(req);
  return isHostAddress(address) ? "Haupt-PC" : `PC ${address}`;
}

function defaultTabletClientName(req) {
  return "Warteraum";
}

function defaultWeighClientName() {
  return "Waage";
}

function defaultDisplayClientName(req, token) {
  const address = getRemoteAddress(req);
  const suffix = String(token || "").slice(0, 4).toUpperCase();
  return `Bildschirm ${address}${suffix ? ` ${suffix}` : ""}`;
}

function sanitizeDisplayClientName(value) {
  const name = String(value || "").trim();
  return name ? name.slice(0, 80) : "Bildschirm";
}

function normalizeDisplayRole(role) {
  const normalized = String(role || "");
  return DISPLAY_ROLES.has(normalized) ? normalized : "";
}

function normalizeDisplayAssignments(input) {
  const output = {};
  for (const [token, role] of Object.entries(input || {})) {
    const normalizedRole = normalizeDisplayRole(role);
    if (token && normalizedRole) output[String(token)] = normalizedRole;
  }
  return output;
}

function getDisplayAssignment(token) {
  return normalizeDisplayRole(state.meta.displayAssignments?.[String(token || "")]);
}

function getRemoteAddress(req) {
  const raw = req?.socket?.remoteAddress || "";
  if (raw.startsWith("::ffff:")) return raw.slice(7);
  if (raw === "::1") return "127.0.0.1";
  return raw || "unbekannt";
}

function isLoopbackAddress(address) {
  return address === "127.0.0.1" || address === "::1" || address === "localhost";
}

function isHostAddress(address) {
  if (isLoopbackAddress(address)) return true;
  return getLocalIPv4Addresses().includes(address);
}

function getLocalIPv4Addresses() {
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) addresses.push(entry.address);
    }
  }
  return addresses;
}

function controlClientIdentity(client) {
  return client?.isLocal ? "host" : `remote:${client?.address || client?.token || "unknown"}`;
}

function getSessionPayload(req) {
  const host = req?.headers?.host || `localhost:${PORT}`;
  return {
    code: sessionCode,
    controlUrl: `http://${host}/`,
    controlUrls: getLanUrls("/"),
    judgeUrl: `http://${host}/judge`,
    urls: getLanUrls("/judge"),
    weighUrl: `http://${host}/waage`,
    weighUrls: getLanUrls("/waage"),
    tabletUrl: `http://${host}/warteraum`,
    tabletUrls: getLanUrls("/warteraum"),
    waitingRoomDisplayUrl: `http://${host}/pi`,
    waitingRoomDisplayUrls: getLanUrls("/pi"),
    displayStationUrl: `http://${host}/display`,
    displayStationUrls: getLanUrls("/display"),
    refereeCount: getRefereeCount(),
    judges: sanitizeJudges(),
    controlClients: sanitizeControlClients(),
    weighClients: sanitizeWeighClients(),
    tabletClients: sanitizeTabletClients(),
    displayClients: sanitizeDisplayClients(),
    displayAssignments: normalizeDisplayAssignments(state.meta.displayAssignments),
    youtube: getYoutubePayload(),
  };
}

async function rotateSessionCode() {
  sessionCode = makeSessionCode();
  clearJudges();
  TABLET_CLIENTS.clear();
  WEIGH_CLIENTS.clear();
  state.meta.judgeConnections = sanitizeJudges();
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  await persistState();
  broadcastSession();
  broadcastState();
}

function makeSessionCode() {
  return String(crypto.randomInt(1000, 10000));
}

function isLoopbackRequest(req) {
  const address = req.socket.remoteAddress || "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function getLanUrls(suffix) {
  const urls = [`http://localhost:${PORT}${suffix}`];
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        urls.push(`http://${address.address}:${PORT}${suffix}`);
      }
    }
  }
  return [...new Set(urls)];
}

function createQrSvg(text) {
  const qr = encodeQrVersion3Low(text);
  const quiet = 4;
  const scale = 8;
  const size = qr.length + quiet * 2;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * scale}" height="${size * scale}" shape-rendering="crispEdges">`,
    `<rect width="100%" height="100%" fill="#fff"/>`,
  ];

  for (let y = 0; y < qr.length; y += 1) {
    for (let x = 0; x < qr.length; x += 1) {
      if (qr[y][x]) parts.push(`<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1" fill="#111820"/>`);
    }
  }

  parts.push("</svg>");
  return parts.join("");
}

function encodeQrVersion3Low(text) {
  const bytes = Buffer.from(text, "utf8");
  if (bytes.length > 55) {
    throw new Error("QR data too long for version 3-L");
  }

  const version = 3;
  const size = 21 + (version - 1) * 4;
  const dataCodewords = 55;
  const eccCodewords = 15;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunction = (x, y, dark) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = Boolean(dark);
    reserved[y][x] = true;
  };

  const drawFinder = (x, y) => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const xx = x + dx;
        const yy = y + dy;
        const inCore = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
        const dark =
          inCore &&
          (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        setFunction(xx, yy, dark);
      }
    }
  };

  const drawAlignment = (cx, cy) => {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) === 2 || (dx === 0 && dy === 0));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  drawAlignment(22, 22);

  for (let i = 8; i < size - 8; i += 1) {
    setFunction(i, 6, i % 2 === 0);
    setFunction(6, i, i % 2 === 0);
  }
  setFunction(8, size - 8, true);

  reserveFormat(modules, reserved, size);

  const data = makeDataCodewords(bytes, dataCodewords);
  const ecc = reedSolomonRemainder(data, eccCodewords);
  const bits = [...data, ...ecc].flatMap((byte) =>
    Array.from({ length: 8 }, (_, index) => ((byte >>> (7 - index)) & 1) === 1),
  );

  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let x = right; x >= right - 1; x -= 1) {
        if (!reserved[y][x]) {
          const mask = (x + y) % 2 === 0;
          modules[y][x] = (bits[bitIndex] || false) !== mask;
          bitIndex += 1;
        }
      }
    }
    upward = !upward;
  }

  drawFormatBits(modules, reserved, size, 0);
  return modules;
}

function reserveFormat(modules, reserved, size) {
  const mark = (x, y) => {
    modules[y][x] = false;
    reserved[y][x] = true;
  };

  for (let i = 0; i <= 5; i += 1) mark(8, i);
  mark(8, 7);
  mark(8, 8);
  mark(7, 8);
  for (let i = 9; i <= 14; i += 1) mark(14 - i, 8);
  for (let i = 0; i <= 7; i += 1) mark(size - 1 - i, 8);
  for (let i = 8; i <= 14; i += 1) mark(8, size - 15 + i);
}

function drawFormatBits(modules, reserved, size, mask) {
  const bits = getFormatBits(1, mask);
  const set = (x, y, index) => {
    modules[y][x] = ((bits >>> index) & 1) !== 0;
    reserved[y][x] = true;
  };

  for (let i = 0; i <= 5; i += 1) set(8, i, i);
  set(8, 7, 6);
  set(8, 8, 7);
  set(7, 8, 8);
  for (let i = 9; i <= 14; i += 1) set(14 - i, 8, i);
  for (let i = 0; i <= 7; i += 1) set(size - 1 - i, 8, i);
  for (let i = 8; i <= 14; i += 1) set(8, size - 15 + i, i);
  modules[size - 8][8] = true;
}

function getFormatBits(errorCorrectionLevelBits, mask) {
  const data = (errorCorrectionLevelBits << 3) | mask;
  let value = data << 10;
  const generator = 0x537;
  for (let i = 14; i >= 10; i -= 1) {
    if (((value >>> i) & 1) !== 0) value ^= generator << (i - 10);
  }
  return ((data << 10) | value) ^ 0x5412;
}

function makeDataCodewords(bytes, capacity) {
  const bits = [];
  const appendBits = (value, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push(((value >>> i) & 1) !== 0);
  };

  appendBits(0b0100, 4);
  appendBits(bytes.length, 8);
  for (const byte of bytes) appendBits(byte, 8);

  const maxBits = capacity * 8;
  appendBits(0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(false);

  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) value = (value << 1) | (bits[i + j] ? 1 : 0);
    data.push(value);
  }

  for (let pad = 0xec; data.length < capacity; pad ^= 0xfd) data.push(pad);
  return data;
}

function reedSolomonRemainder(data, degree) {
  const generator = reedSolomonGenerator(degree);
  const message = [...data, ...Array(degree).fill(0)];
  for (let i = 0; i < data.length; i += 1) {
    const factor = message[i];
    if (factor === 0) continue;
    for (let j = 0; j < generator.length; j += 1) {
      message[i + j] ^= gfMultiply(generator[j], factor);
    }
  }
  return message.slice(data.length);
}

function reedSolomonGenerator(degree) {
  let result = [1];
  for (let i = 0; i < degree; i += 1) {
    result = polynomialMultiply(result, [1, gfPower(2, i)]);
  }
  return result;
}

function polynomialMultiply(left, right) {
  const result = Array(left.length + right.length - 1).fill(0);
  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < right.length; j += 1) {
      result[i + j] ^= gfMultiply(left[i], right[j]);
    }
  }
  return result;
}

function gfPower(base, exponent) {
  let result = 1;
  for (let i = 0; i < exponent; i += 1) result = gfMultiply(result, base);
  return result;
}

function gfMultiply(x, y) {
  let result = 0;
  for (let i = 0; i < 8; i += 1) {
    if ((y & 1) !== 0) result ^= x;
    const carry = (x & 0x80) !== 0;
    x = (x << 1) & 0xff;
    if (carry) x ^= 0x1d;
    y >>>= 1;
  }
  return result;
}

function parseInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseOptionalPositiveFloat(value) {
  const parsed = parseFloatSafe(value);
  if (value === "" || value === null || value === undefined) return null;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseOptionalPositiveInteger(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = parseInteger(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseOptionalBirthYear(value) {
  const parsed = parseInteger(value);
  if (!parsed || parsed < 1900 || parsed > 2100) return null;
  return parsed;
}

function parseFloatSafe(value) {
  if (value === "" || value === null || value === undefined) return null;
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
