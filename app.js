"use strict";

const STORE_KEY = "gewichtheben-wettkampf-v1";
const CONTROL_CLIENT_KEY = "gewichtheben-wettkampf-control-client";
const WINDOW_SCREEN_ASSIGNMENTS_KEY = "gewichtheben-window-screen-assignments";

const LIFTS = {
  snatch: { label: "Reißen", short: "R" },
  cleanJerk: { label: "Stoßen", short: "S" },
};

const THREE_REFEREE_SLOTS = [
  { key: "left", label: "Links", voteIndex: 0 },
  { key: "center", label: "Mitte", voteIndex: 1 },
  { key: "right", label: "Rechts", voteIndex: 2 },
];
const SOLO_REFEREE_SLOTS = [{ key: "solo", label: "Kampfrichter", voteIndex: 0 }];

const GENDERS = {
  male: { label: "Mann", barWeight: 20, relativeKey: "male" },
  female: { label: "Frau", barWeight: 15, relativeKey: "female" },
  child: { label: "Kind", barWeight: 5, relativeKey: "child" },
};

const DEFAULT_GROUP = {
  id: "group-a",
  name: "A",
  order: 1,
  completed: false,
  snatchCompleted: false,
  cleanJerkCompleted: false,
};

const AGE_CLASSES = [
  { key: "children", label: "Kinder bis 12 Jahre", weightType: "child" },
  { key: "school", label: "Schüler/-innen 13-15 Jahre", weightType: "child" },
  { key: "youth", label: "Jugend 16-17 Jahre", weightType: "youth" },
  { key: "junior", label: "Juniorinnen/Junioren 18-20 Jahre", weightType: "senior" },
  { key: "senior", label: "Frauen/Männer ab 18 Jahre", weightType: "senior" },
  { key: "masters", label: "Masters ab 30 Jahre", weightType: "senior" },
];

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

const SCORING_MODES = {
  CLUB: "CLUB",
  IWF: "IWF",
};
const DISPLAY_ROLES = [
  { key: "", label: "Nicht zugewiesen" },
  { key: "plates", label: "Scheibenanzeige" },
  { key: "scoreboard", label: "Protokoll und Ergebnisse" },
  { key: "waitingRoom", label: "Warteraum-Anzeige" },
];
const LOCAL_WINDOW_TARGETS = [
  {
    key: "plates",
    label: "Scheibensteckeranzeige",
    path: "/plates",
    windowName: "gewichtheben-plates",
    width: 1100,
    height: 760,
  },
  {
    key: "scoreboard",
    label: "Protokoll und Ergebnisse",
    path: "/scoreboard",
    windowName: "gewichtheben-scoreboard",
    width: 1180,
    height: 760,
  },
  {
    key: "waitingRoom",
    label: "Warteraum-Anzeige",
    path: "/pi",
    windowName: "gewichtheben-warteraum-anzeige",
    width: 1180,
    height: 760,
  },
];

const CLUB_LOGO_SRC = "assets/wappen.png";
const IWF_LOGO_SRC = "assets/iwf-logo.svg";
const MAX_WAITING_ROOM_CHANGES = 2;
const IWF_BODYWEIGHT_CATEGORIES = {
  senior: {
    female: [48, 53, 58, 63, 69, 77, 86],
    male: [60, 65, 71, 79, 88, 94, 110],
  },
  youth: {
    female: [44, 48, 53, 58, 63, 69, 77],
    male: [56, 60, 65, 71, 79, 88, 94],
  },
};
const IWF_AGE_GROUP_LABELS = {
  youth: "Youth",
  junior: "Junior",
  senior: "Senior",
  masters: "Senior",
};
const IWF_MINIMUM_ATTEMPT_WEIGHT = {
  female: 21,
  male: 26,
};
const IWF_PLACEMENT_POINTS = [0, 28, 25, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const CLUB_SETUP_VIEWS = ["guided", "competition", "athletes", "teams", "network", "youtube", "relative", "ageFactor", "categories", "plates", "support"];
const IWF_SETUP_VIEWS = ["guided", "competition", "athletes", "teams", "network", "youtube", "plates", "support"];
const IWF_REPORT_LOGO = `
  <svg viewBox="0 0 260 320" role="img" aria-label="IWF" class="report-logo-svg">
    <rect width="260" height="320" rx="28" fill="#050b14"/>
    <g fill="#ffffff">
      <path d="M112 34c-47 8-82 48-82 96 0 54 44 98 98 98 31 0 59-14 77-37-16 12-36 19-57 19-54 0-98-44-98-98 0-34 17-64 43-82 6-4 12-7 19-10Z"/>
      <path d="M164 40c41 20 66 56 66 100 0 43-25 80-66 100 29-4 54-16 74-35 27-25 42-57 42-92s-15-67-42-92c-20-19-45-31-74-35v54Z" transform="translate(-20 0)"/>
      <circle cx="112" cy="130" r="28"/>
      <path d="M26 260h25v46H26v-46Zm45 0h25l13 46 16-46h22l16 46 13-46h25l-26 46h-25l-14-37-14 37H97l-26-46Zm151 0h54v15h-30v9h25v14h-25v8h-24v-46Z"/>
    </g>
  </svg>
`;

const RELATIVE_TABLE_START_WEIGHT = 31;
const AGE_FACTOR_START_AGE = 30;
const AGE_FACTOR_END_AGE = 90;
const DEFAULT_RELATIVE_VALUES = {
  male:
    "22.5,23,23.5,24,24.5,25,25.5,26,26.5,27,27.5,28,28.5,29,29.5,30,30.5,31,32,33,34.5,36,37,38.5,40,42,44,46,48,50,52,54,56,57.5,59,60.5,62,63.5,65,66.5,68,69.5,70.5,71.5,72.5,74,75.5,77,78,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,95.5,96,96.5,97,97.5,98.5,99.5,100.5,101,102,103,103.5,103.5,104,104,104,104.5,104.5,105,105,105.5,106,106.5,107,107.5,108,108.5,109,109.5,110,110.5,111,111.5,112,112.5,113,113.5,114,114.5,115,115.5,116,116.5,117,117.5,118,118.5,119,119.5,120,120.5,121,121.5,122,122.5,123,123.5,124,124.5,125,125.5,126,126.5,127,127.5",
  female:
    "12.5,12.5,12.5,12.5,12.5,12.5,12.5,12.5,12.5,12.5,13,13,13.5,13.5,14,14,14.5,15,15.5,16,16.5,17,17.5,18.5,19.5,20.5,21.5,22.5,23.5,25,26.5,27.5,28.5,29.5,31,32,33,34,35,36,37,38,39,39.5,40,40.5,41,41.5,42,42.5,43,43.5,44,44.5,44.5,45,45.5,46,46,46.5,47,47.5,47.5,48,48.5,48.5,49,49.5,49.5,50,50.5,50.5,51,51,51.5,52,52,52,52.5,52.5,53,53,53.5,53.5,54,54,54.5,54.5,55,55,55.5,55.5,56,56,56.5,56.5,57,57,57.5,57.5,58,58,58.5,58.5,59,59,59.5,59.5,60,60,60.5,60.5,61,61,61.5,61.5,62,62,62.5,62.5,63,63,63.5,63.5,64,64,64.5,64.5,65,65",
};
const DEFAULT_AGE_FACTOR_VALUES = {
  male:
    "30:1,31:1.016,32:1.031,33:1.046,34:1.059,35:1.072,36:1.083,37:1.096,38:1.109,39:1.122,40:1.135,41:1.149,42:1.162,43:1.176,44:1.189,45:1.203,46:1.218,47:1.233,48:1.248,49:1.263,50:1.279,51:1.297,52:1.316,53:1.338,54:1.361,55:1.385,56:1.411,57:1.437,58:1.462,59:1.488,60:1.514,61:1.541,62:1.568,63:1.598,64:1.629,65:1.663,66:1.699,67:1.738,68:1.779,69:1.823,70:1.867,71:1.91,72:1.953,73:2.004,74:2.06,75:2.117,76:2.181,77:2.255,78:2.336,79:2.419,80:2.504,81:2.597,82:2.702,83:2.831,84:2.981,85:3.153,86:3.352,87:3.58,88:3.843,89:4.145,90:4.493",
  female:
    "30:1,31:1.016,32:1.031,33:1.046,34:1.059,35:1.072,36:1.084,37:1.097,38:1.11,39:1.124,40:1.138,41:1.153,42:1.17,43:1.187,44:1.205,45:1.223,46:1.244,47:1.265,48:1.288,49:1.313,50:1.34,51:1.369,52:1.401,53:1.435,54:1.47,55:1.507,56:1.545,57:1.585,58:1.625,59:1.665,60:1.705,61:1.744,62:1.778,63:1.808,64:1.839,65:1.873,66:1.909,67:1.948,68:1.989,69:2.033,70:2.077,71:2.12,72:2.163,73:2.214,74:2.27,75:2.327,76:2.391,77:2.465,78:2.546,79:2.629,80:2.714",
};

const emptyState = () => ({
  meta: {
    eventName: "",
    category: "",
    group: "A",
    mode: "setup",
    activeLift: "snatch",
    activeGroupId: null,
    refereeCount: 3,
    scoringMode: SCORING_MODES.CLUB,
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
  categories: createDefaultCategories(),
  relativeTables: createDefaultRelativeTables(),
  ageFactors: createDefaultAgeFactors(),
  plates: createDefaultPlates(),
  teams: [],
  athletes: [],
});

let state = emptyState();
let editingAthleteId = null;
let judgeDraft = { key: null, votes: [null, null, null] };
let techniqueDraft = { key: null, points: [null, null, null] };
let plannedNextDraft = { key: null, weight: null };
let relativeTableGender = "male";
let ageFactorGender = "male";
let activeSetupView = "guided";
let guidedSetupStepIndex = 0;
let guidedSetupReturnActive = false;
let toastTimer = null;
let serverMode = false;
let sessionInfo = null;
let controlClientToken = loadControlClientToken();
let controlHeartbeatTimer = null;
let eventSource = null;
let syncTimer = null;
let serverSaveInFlight = 0;
let serverSaveChain = Promise.resolve();
let localWindowScreenAssignments = loadWindowScreenAssignments();
let localScreens = [];
let localScreenDetectionMessage = "";
let youtubeDevices = { cameras: [], microphones: [] };
let youtubePreviewStream = null;
let youtubeMediaStream = null;
let youtubeSourceMediaStream = null;
let youtubeOverlayCanvasStream = null;
let youtubeOverlayVideo = null;
let youtubeOverlayFrameRequest = null;
let youtubeRecorder = null;
let youtubeUploadChain = Promise.resolve();
let youtubeDevicePermissionRequested = false;
let youtubeSaveTimer = null;
let youtubePreviewStartTimer = null;

const $ = (selector) => document.querySelector(selector);

const els = {};

function normalizeScoringMode(value) {
  return value === SCORING_MODES.IWF ? SCORING_MODES.IWF : SCORING_MODES.CLUB;
}

function normalizeDisplayRole(role) {
  const value = String(role || "");
  return DISPLAY_ROLES.some((item) => item.key === value) ? value : "";
}

function normalizeDisplayAssignments(input) {
  const output = {};
  for (const [id, role] of Object.entries(input || {})) {
    const normalizedRole = normalizeDisplayRole(role);
    if (id && normalizedRole) output[id] = normalizedRole;
  }
  return output;
}

function getScoringMode() {
  return normalizeScoringMode(state?.meta?.scoringMode);
}

function isIwfMode() {
  return getScoringMode() === SCORING_MODES.IWF;
}

function setScoringMode(mode) {
  if (state.meta.mode !== "setup") {
    if (els.iwfRulesEnabled) els.iwfRulesEnabled.checked = isIwfMode();
    showToast("Der Regelmodus kann nur vor dem Start des Wettkampfs geändert werden.");
    return;
  }
  const previousRefereeCount = getRefereeCount();
  state.meta.scoringMode = normalizeScoringMode(mode);
  if (state.meta.scoringMode === SCORING_MODES.IWF) {
    state.meta.refereeCount = 3;
    if (previousRefereeCount !== 3) resetJudgeConnections();
    if (!getAllowedSetupViews().includes(activeSetupView)) activeSetupView = "competition";
  }
  saveState();
  render();
}

function getActiveLogo(mode = getScoringMode()) {
  return normalizeScoringMode(mode) === SCORING_MODES.IWF ? IWF_LOGO_SRC : CLUB_LOGO_SRC;
}

function applyScoringModeTheme(mode = getScoringMode()) {
  document.body.classList.toggle("iwf-mode", normalizeScoringMode(mode) === SCORING_MODES.IWF);
}

function renderActiveLogos() {
  const logoSrc = getActiveLogo();
  const logoAlt =
    getScoringMode() === SCORING_MODES.IWF
      ? "International Weightlifting Federation"
      : "STC Bavaria 20 Landshut e. V.";
  document.querySelectorAll("[data-active-logo]").forEach((image) => {
    image.setAttribute("src", logoSrc);
    image.setAttribute("alt", logoAlt);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  bindEvents();
  await initializeState();
  syncPhase();
  render();
});

function cacheElements() {
  Object.assign(els, {
    setupPanel: $("#setup-panel"),
    competitionPanel: $("#competition-panel"),
    connectionPanel: $("#connection-panel"),
    guidedSetupPanel: $("#guided-setup-panel"),
    guidedReturnBar: $("#guided-return-bar"),
    eventSummary: $("#event-summary"),
    eventForm: $("#event-form"),
    eventName: $("#event-name"),
    eventCategory: $("#event-category"),
    eventGroup: $("#event-group"),
    refereeCount: $("#referee-count"),
    iwfRulesEnabled: $("#iwf-rules-enabled"),
    childTechniqueEnabled: $("#child-technique-enabled"),
    streamStatusTop: $("#stream-status-top"),
    streamStatusTopLabel: $("#stream-status-top-label"),
    topCameraPreview: $("#top-camera-preview"),
    topCameraVideo: $("#top-camera-video"),
    topCameraEmpty: $("#top-camera-empty"),
    youtubeEndStream: $("#youtube-end-stream"),
    youtubeForm: $("#youtube-form"),
    youtubeEnabled: $("#youtube-enabled"),
    youtubeClientId: $("#youtube-client-id"),
    youtubeClientSecret: $("#youtube-client-secret"),
    youtubePrivacy: $("#youtube-privacy"),
    youtubeTitle: $("#youtube-title"),
    youtubeFfmpegPath: $("#youtube-ffmpeg-path"),
    youtubeCamera: $("#youtube-camera"),
    youtubeMicrophone: $("#youtube-microphone"),
    youtubePreview: $("#youtube-preview"),
    youtubePreviewEmpty: $("#youtube-preview-empty"),
    youtubeStatusBox: $("#youtube-status-box"),
    youtubeStatusPill: $("#youtube-status-pill"),
    youtubeStatusTitle: $("#youtube-status-title"),
    youtubeStatusText: $("#youtube-status-text"),
    youtubeWatchUrl: $("#youtube-watch-url"),
    athleteForm: $("#athlete-form"),
    athleteName: $("#athlete-name"),
    athleteTeam: $("#athlete-team"),
    athleteTeamId: $("#athlete-team-id"),
    athleteStart: $("#athlete-start"),
    athleteGroup: $("#athlete-group"),
    athleteGender: $("#athlete-gender"),
    athleteAgeClass: $("#athlete-age-class"),
    athleteBirthYear: $("#athlete-birth-year"),
    athleteWeightClass: $("#athlete-weight-class"),
    athleteLot: $("#athlete-lot"),
    athleteEntryTotal: $("#athlete-entry-total"),
    saveAthlete: $("#save-athlete"),
    cancelEdit: $("#cancel-edit"),
    weighInDialog: $("#weigh-in-dialog"),
    weighInForm: $("#weigh-in-form"),
    weighGroupFilter: $("#weigh-group-filter"),
    weighAthlete: $("#weigh-athlete"),
    weighBodyweight: $("#weigh-bodyweight"),
    weighSnatch: $("#weigh-snatch"),
    weighCj: $("#weigh-cj"),
    weighAthleteSummary: $("#weigh-athlete-summary"),
    athletesTable: $("#athletes-table"),
    teamForm: $("#team-form"),
    teamName: $("#team-name"),
    teamMaxScorers: $("#team-max-scorers"),
    teamsList: $("#teams-list"),
    groupForm: $("#group-form"),
    groupName: $("#group-name"),
    groupsList: $("#groups-list"),
    currentAttempt: $("#current-attempt"),
    queueTable: $("#queue-table"),
    standingsTable: $("#standings-table"),
    standingsHead: $("#standings-head"),
    protocolTable: $("#protocol-table"),
    queueCount: $("#queue-count"),
    teamStandingsTable: $("#team-standings-table"),
    teamStandingsHead: $("#team-standings-head"),
    teamCount: $("#team-count"),
    progressPill: $("#progress-pill"),
    phaseEyebrow: $("#phase-eyebrow"),
    phaseTitle: $("#phase-title"),
    snatchTab: $("#snatch-tab"),
    cleanTab: $("#clean-tab"),
    importFile: $("#import-file"),
    backupDialog: $("#backup-dialog"),
    backupList: $("#backup-list"),
    displayRoutingDialog: $("#display-routing-dialog"),
    displayRoutingList: $("#display-routing-list"),
    windowScreenDialog: $("#window-screen-dialog"),
    windowScreenList: $("#window-screen-list"),
    windowScreenStatus: $("#window-screen-status"),
    relativeDialog: $("#relative-dialog"),
    relativeTableBody: $("#relative-table-body"),
    ageFactorTableBody: $("#age-factor-table-body"),
    platesDialog: $("#plates-dialog"),
    platesTableBody: $("#plates-table-body"),
    categoryDialog: $("#category-dialog"),
    categoryTableBody: $("#category-table-body"),
    toast: $("#toast"),
  });
}

function bindEvents() {
  els.eventForm.addEventListener("input", updateSetupMetaFromForms);
  els.refereeCount.addEventListener("input", updateSetupMetaFromForms);

  els.athleteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAthleteFromForm();
  });

  els.groupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveGroupFromForm();
  });

  els.teamForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTeamFromForm();
  });

  if (els.youtubeForm) {
    els.youtubeForm.addEventListener("input", () => saveYouTubeSettings({ silent: true, debounce: true }));
    els.youtubeForm.addEventListener("change", handleYouTubeFormChange);
  }

  els.weighInForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveWeighInFromForm();
  });

  document.body.addEventListener("click", handleClick);
  document.body.addEventListener("input", handleInput);
  document.body.addEventListener("change", handleChange);

  els.athleteGender.addEventListener("change", () => {
    renderAthleteBarHint();
    renderWeightClassSelect();
  });
  els.athleteAgeClass.addEventListener("change", renderWeightClassSelect);
  els.importFile.addEventListener("change", importData);
}

function updateSetupMetaFromForms() {
  const previousRefereeCount = getRefereeCount();
  state.meta.eventName = els.eventName.value;
  state.meta.category = els.eventCategory.value;
  state.meta.group = els.eventGroup.value || "A";
  state.meta.refereeCount = isIwfMode() ? 3 : parseRefereeCount(els.refereeCount.value);
  state.meta.childTechniqueEnabled = Boolean(els.childTechniqueEnabled?.checked);
  if (state.meta.refereeCount !== previousRefereeCount) {
    resetJudgeConnections();
  }
  saveState();
  renderHeader();
  renderConnection();
}

async function initializeState() {
  if (location.protocol === "http:" || location.protocol === "https:") {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      if (!response.ok) throw new Error("No server state");
      state = normalizeState(await response.json());
      serverMode = true;
      await loadSessionInfo();
      await registerControlClient();
      startEventStream();
      startServerPolling();
      startControlHeartbeat();
      return;
    } catch (error) {
      serverMode = false;
    }
  }

  state = loadState();
}

async function loadSessionInfo() {
  if (!serverMode) return;
  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    if (response.ok) sessionInfo = await response.json();
  } catch (error) {
    sessionInfo = null;
  }
}

async function loadServerState() {
  if (!serverMode) return;
  const response = await fetch("/api/state", { cache: "no-store" });
  if (response.ok) state = normalizeState(await response.json());
}

async function registerControlClient() {
  if (!serverMode) return;
  try {
    const response = await fetch("/api/control/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: controlClientToken }),
    });
    if (!response.ok) return;
    const result = await response.json();
    if (result.token && result.token !== controlClientToken) {
      controlClientToken = result.token;
      saveControlClientToken(controlClientToken);
    }
    if (result.session) sessionInfo = result.session;
    renderConnection();
  } catch (error) {
    // The normal server polling will surface reconnect state if needed.
  }
}

function startControlHeartbeat() {
  if (!serverMode || controlHeartbeatTimer) return;
  controlHeartbeatTimer = window.setInterval(registerControlClient, 5000);
  window.addEventListener("beforeunload", () => {
    if (!controlClientToken) return;
    const payload = JSON.stringify({ token: controlClientToken });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/control/logout", new Blob([payload], { type: "application/json" }));
    }
  });
}

function startEventStream() {
  if (!serverMode || eventSource) return;

  eventSource = new EventSource("/api/events");
  eventSource.addEventListener("state", (event) => {
    if (serverSaveInFlight > 0) return;
    state = normalizeState(JSON.parse(event.data));
    renderAfterStateSync();
  });
  eventSource.addEventListener("session", (event) => {
    sessionInfo = JSON.parse(event.data);
    if (sessionInfo?.judges) {
      state.meta.judgeConnections = sessionInfo.judges;
    }
    renderHeader();
    renderConnection();
    if (activeSetupView === "youtube") renderYouTubeSettings();
    if (els.displayRoutingDialog?.open) renderDisplayRoutingDialog();
  });
  eventSource.addEventListener("error", () => {
    showToast("Live-Verbindung zum lokalen Server wird wiederhergestellt.");
  });
}

function startServerPolling() {
  if (!serverMode || syncTimer) return;

  syncTimer = window.setInterval(async () => {
    try {
      const [stateResponse, sessionResponse] = await Promise.all([
        fetch("/api/state", { cache: "no-store" }),
        fetch("/api/session", { cache: "no-store" }),
      ]);
      if (stateResponse.ok && serverSaveInFlight === 0) state = normalizeState(await stateResponse.json());
      if (sessionResponse.ok) {
        sessionInfo = await sessionResponse.json();
        if (sessionInfo?.judges) state.meta.judgeConnections = sessionInfo.judges;
      }
      renderAfterStateSync();
    } catch (error) {
      // The EventSource reconnect handler already gives the visible feedback.
    }
  }, 1500);
}

function renderAfterStateSync() {
  syncPhase();
  if (shouldDeferRenderForActiveInput()) {
    renderConnection();
    if (activeSetupView === "youtube") renderYouTubeStatusOnly();
    if (els.displayRoutingDialog?.open) renderDisplayRoutingDialog();
    return;
  }
  render();
  if (els.displayRoutingDialog?.open) renderDisplayRoutingDialog();
}

function shouldDeferRenderForActiveInput() {
  const active = document.activeElement;
  if (!active) return false;
  return (
    active.id === "current-weight" ||
    active.id === "planned-next-weight" ||
    Boolean(active.closest?.("#weigh-in-dialog")) ||
    Boolean(active.closest?.("#backup-dialog")) ||
    Boolean(active.closest?.("#display-routing-dialog")) ||
    Boolean(active.closest?.("#window-screen-dialog")) ||
    Boolean(active.closest?.("#relative-dialog")) ||
    Boolean(active.closest?.("#plates-dialog")) ||
    Boolean(active.closest?.("#category-dialog")) ||
    Boolean(active.closest?.("#athlete-form")) ||
    Boolean(active.closest?.("#event-form")) ||
    Boolean(active.closest?.("#youtube-form")) ||
    Boolean(active.closest?.("#group-form")) ||
    Boolean(active.closest?.("#team-form")) ||
    Boolean(active.closest?.("[data-relative-field]")) ||
    Boolean(active.closest?.("[data-age-factor-field]")) ||
    Boolean(active.closest?.("[data-category-field]")) ||
    Boolean(active.closest?.("[data-plate-field]")) ||
    Boolean(active.closest?.("[data-team-field]")) ||
    Boolean(active.closest?.(".groups-list")) ||
    Boolean(active.closest?.(".queue-panel"))
  );
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit-athlete") editAthlete(id);
  if (action === "delete-athlete") deleteAthlete(id);
  if (action === "delete-group") deleteGroup(id);
  if (action === "delete-team") deleteTeam(id);
  if (action === "move-group") moveGroup(id, button.dataset.direction);
  if (action === "set-setup-view") setSetupView(button.dataset.view);
  if (action === "guided-next") guidedSetupNext();
  if (action === "guided-prev") guidedSetupPrev();
  if (action === "guided-cancel") guidedSetupCancel();
  if (action === "guided-open-view") guidedSetupOpenView(button.dataset.view);
  if (action === "guided-return") guidedSetupReturn();
  if (action === "guided-return-next") guidedSetupNext();
  if (action === "guided-set-mode") guidedSetupSetMode(button.dataset.mode);
  if (action === "guided-start-competition") startCompetition();
  if (action === "cancel-edit") clearAthleteForm();
  if (action === "close-weigh-in") closeWeighInDialog();
  if (action === "weigh-prev") moveWeighInSelection(-1);
  if (action === "weigh-next") moveWeighInSelection(1);
  if (action === "start-competition") startCompetition();
  if (action === "open-plates") openPlateWindow();
  if (action === "open-waiting-room-display") openWaitingRoomDisplayWindow();
  if (action === "open-display-routing") openDisplayRoutingDialog();
  if (action === "close-display-routing") closeDisplayRoutingDialog();
  if (action === "open-window-screen-settings") openWindowScreenDialog();
  if (action === "close-window-screen-settings") closeWindowScreenDialog();
  if (action === "refresh-local-screens") refreshLocalScreens({ notify: true });
  if (action === "youtube-save-settings") saveYouTubeSettings();
  if (action === "youtube-connect") connectYouTubeAccount();
  if (action === "youtube-refresh-devices") refreshYouTubeDevices({ requestPermission: true });
  if (action === "youtube-preview") startYouTubePreview();
  if (action === "youtube-install-ffmpeg") installYouTubeFfmpeg();
  if (action === "end-youtube-stream") endYouTubeLiveStream();
  if (action === "open-category-settings") openCategorySettings();
  if (action === "close-category-settings") closeCategorySettings();
  if (action === "add-category-row") addCategoryRow();
  if (action === "delete-category-row") deleteCategoryRow(button.dataset.id);
  if (action === "reset-categories") resetCategories();
  if (action === "open-plate-settings") openPlateSettings();
  if (action === "close-plate-settings") closePlateSettings();
  if (action === "add-plate-row") addPlateRow();
  if (action === "delete-plate-row") deletePlateRow(button.dataset.id);
  if (action === "reset-plates") resetPlates();
  if (action === "rotate-code") rotateSessionCode();
  if (action === "open-relative-table") openRelativeTable();
  if (action === "close-relative-table") closeRelativeTable();
  if (action === "set-relative-gender") setRelativeGender(button.dataset.gender);
  if (action === "add-relative-row") addRelativeRow();
  if (action === "delete-relative-row") deleteRelativeRow(Number(button.dataset.index));
  if (action === "reset-relative-table") resetRelativeTable();
  if (action === "set-age-factor-gender") setAgeFactorGender(button.dataset.gender);
  if (action === "add-age-factor-row") addAgeFactorRow();
  if (action === "delete-age-factor-row") deleteAgeFactorRow(Number(button.dataset.index));
  if (action === "reset-age-factor-table") resetAgeFactorTable();
  if (action === "set-judge") setJudgeVote(button);
  if (action === "clear-votes") clearJudgeVotes();
  if (action === "record-attempt") recordCurrentAttempt();
  if (action === "start-clean-jerk") startCleanJerk();
  if (action === "start-next-group") startNextGroup();
  if (action === "undo-attempt") undoLastAttempt();
  if (action === "reset-competition") resetCompetition();
  if (action === "reset-all") resetAllData();
  if (action === "export-data") exportData();
  if (action === "open-backups") openBackupDialog();
  if (action === "close-backups") closeBackupDialog();
  if (action === "restore-backup") restoreBackup(button.dataset.file);
  if (action === "generate-registration-list") generateRegistrationList();
  if (action === "generate-report") generateReport();
  if (action === "generate-start-lists") generateStartLists();
  if (action === "import-data-trigger") els.importFile.click();
  if (action === "toggle-withdrawn") toggleWithdrawn(id);
}

function handleInput(event) {
  const input = event.target;

  if (input.id === "planned-next-weight") {
    const current = getCurrentAttempt();
    plannedNextDraft = {
      key: current ? attemptKey(current) : null,
      weight: parseInteger(input.value),
    };
    return;
  }

  if (input.id === "current-weight") {
    const current = getCurrentAttempt();
    if (current && attemptKey(current) === input.dataset.key) {
      const value = parseInteger(input.value);
      if (value) current.athlete.next[current.lift] = value;
    }
    return;
  }

  const groupInput = input.closest("[data-group-field]");
  if (groupInput) {
    updateGroupField(groupInput);
    return;
  }

  const teamInput = input.closest("[data-team-field]");
  if (teamInput) {
    updateTeamField(teamInput, { save: false });
    return;
  }

  const plateInput = input.closest("[data-plate-field]");
  if (plateInput) {
    updatePlateField(plateInput, { save: false });
    return;
  }

  const categoryInput = input.closest("[data-category-field]");
  if (categoryInput) {
    updateCategoryField(categoryInput, { save: false });
    return;
  }

  const ageFactorInput = input.closest("[data-age-factor-field]");
  if (ageFactorInput) {
    updateAgeFactorField(ageFactorInput, { save: false });
    return;
  }

  const relativeInput = input.closest("[data-relative-field]");
  if (!relativeInput) return;

  updateRelativeField(relativeInput, { save: false });
}

function updateRelativeField(relativeInput, options = { save: true }) {
  const index = Number(relativeInput.dataset.index);
  const field = relativeInput.dataset.relativeField;
  const table = getRelativeTable(relativeTableGender);
  if (!table[index]) return;
  const value = parseFloatSafe(relativeInput.value);
  table[index][field] = value || 0;
  if (options.save) {
    sortRelativeTable(relativeTableGender);
    saveState();
    renderRelativeTable();
    renderStandings();
  }
}

function handleChange(event) {
  if (event.target === els.iwfRulesEnabled) {
    setScoringMode(event.target.checked ? SCORING_MODES.IWF : SCORING_MODES.CLUB);
    return;
  }

  if (event.target === els.weighGroupFilter) {
    renderWeighInAthleteOptions();
    if (els.weighAthlete.value) loadWeighInAthlete(els.weighAthlete.value);
    else showToast("In dieser Gruppe sind keine Athleten angelegt.");
    return;
  }

  if (event.target === els.weighAthlete) {
    loadWeighInAthlete(els.weighAthlete.value);
    return;
  }

  const displayAssignment = event.target.closest("[data-display-assignment]");
  if (displayAssignment) {
    assignDisplayRole(displayAssignment.dataset.id, displayAssignment.value);
    return;
  }

  const windowScreenAssignment = event.target.closest("[data-window-screen-assignment]");
  if (windowScreenAssignment) {
    setWindowScreenAssignment(windowScreenAssignment.dataset.target, windowScreenAssignment.value);
    return;
  }

  const categoryInput = event.target.closest("[data-category-field]");
  if (categoryInput) {
    updateCategoryField(categoryInput, { save: true });
    return;
  }

  const plateInput = event.target.closest("[data-plate-field]");
  if (plateInput) {
    updatePlateField(plateInput, { save: true });
    return;
  }

  const teamInput = event.target.closest("[data-team-field]");
  if (teamInput) {
    updateTeamField(teamInput, { save: true });
    return;
  }

  const ageFactorInput = event.target.closest("[data-age-factor-field]");
  if (ageFactorInput) {
    updateAgeFactorField(ageFactorInput, { save: true });
    return;
  }

  const relativeInput = event.target.closest("[data-relative-field]");
  if (relativeInput) {
    updateRelativeField(relativeInput, { save: true });
    return;
  }

  const input = event.target.closest("[data-field]");
  if (!input) return;

  const id = input.dataset.id;
  const field = input.dataset.field;
  const athlete = findAthlete(id);
  if (!athlete) return;

  if (field === "next-snatch" || field === "next-cleanJerk") {
    const lift = field.replace("next-", "");
    const weight = parseInteger(input.value);
    if (!weight || weight < 1) {
      showToast("Bitte ein ganzzahliges Gewicht in kg eintragen.");
      render();
      return;
    }
    athlete.next[lift] = weight;
    saveState();
    render();
  }
}

function saveAthleteFromForm() {
  const name = els.athleteName.value.trim();
  const existingAthlete = editingAthleteId ? findAthlete(editingAthleteId) : null;
  const startNo = existingAthlete?.startNo || parseInteger(els.athleteStart.value) || nextStartNumber();
  const openers = existingAthlete?.openers || { snatch: null, cleanJerk: null };

  if (!name) {
    showToast("Bitte einen Namen eintragen.");
    return;
  }

  if (!els.athleteAgeClass.value || !els.athleteWeightClass.value) {
    showToast("Bitte Altersklasse und Gewichtsklasse auswählen.");
    return;
  }

  const duplicate = state.athletes.find(
    (athlete) => athlete.startNo === startNo && athlete.id !== editingAthleteId,
  );
  if (duplicate) {
    showToast("Diese Startnummer ist bereits vergeben.");
    return;
  }

  const payload = {
    name,
    team: els.athleteTeam.value.trim(),
    teamId: els.athleteTeamId.value || "",
    startNo,
    groupId: els.athleteGroup.value || getOrderedGroups()[0]?.id || "group-a",
    gender: normalizeGender(els.athleteGender.value),
    ageClass: normalizeAgeClass(els.athleteAgeClass.value),
    birthYear: parseOptionalBirthYear(els.athleteBirthYear?.value),
    weightClass: els.athleteWeightClass.value,
    barWeight: barWeightForGender(els.athleteGender.value),
    lotNo: parseInteger(els.athleteLot.value) || startNo,
    bodyweight: existingAthlete?.bodyweight || null,
    entryTotal: parseInteger(els.athleteEntryTotal.value),
    openers: { snatch: openers.snatch || null, cleanJerk: openers.cleanJerk || null },
  };

  if (editingAthleteId) {
    const athlete = findAthlete(editingAthleteId);
    if (!athlete) return;
    Object.assign(athlete, payload);
    if (state.meta.mode === "setup") {
      athlete.attempts = athlete.attempts || { snatch: [], cleanJerk: [] };
      athlete.next = { snatch: payload.openers.snatch, cleanJerk: payload.openers.cleanJerk };
    }
  } else {
    state.athletes.push({
      id: createId(),
      ...payload,
      withdrawn: false,
      next: { snatch: payload.openers.snatch, cleanJerk: payload.openers.cleanJerk },
      nextChangeCounts: {},
      attempts: { snatch: [], cleanJerk: [] },
    });
  }

  sortAthletes();
  saveState();
  clearAthleteForm();
  render();
}

function saveGroupFromForm() {
  const name = els.groupName.value.trim();
  if (!name) {
    showToast("Bitte einen Gruppennamen eintragen.");
    return;
  }

  const duplicate = state.groups.find((group) => group.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    showToast("Diese Gruppe gibt es bereits.");
    return;
  }

  state.groups.push({
    id: createId(),
    name,
    order: nextGroupOrder(),
    completed: false,
    snatchCompleted: false,
    cleanJerkCompleted: false,
  });
  sortGroups();
  saveState();
  els.groupForm.reset();
  render();
}

async function saveTeamFromForm() {
  const name = els.teamName.value.trim();
  const maxScorers = parseInteger(els.teamMaxScorers.value) || 6;
  if (!name) {
    showToast("Bitte einen Mannschaftsnamen eintragen.");
    return;
  }

  const duplicate = getTeams().find((team) => team.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    showToast("Diese Mannschaft gibt es bereits.");
    return;
  }

  const team = {
    id: createId(),
    name,
    maxScorers: clampScorerCount(maxScorers),
  };

  if (serverMode) {
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(team),
      });
      const result = await response.json();
      if (!response.ok) {
        showToast(result.error || "Mannschaft konnte nicht angelegt werden.");
        return;
      }
      state = normalizeState(result.state);
      resetTeamForm();
      render();
      return;
    } catch (error) {
      showToast("Mannschaft konnte nicht am lokalen Server gespeichert werden.");
      return;
    }
  }

  getTeams().push(team);
  saveState();
  resetTeamForm();
  render();
}

function resetTeamForm() {
  els.teamForm.reset();
  els.teamMaxScorers.value = "6";
}

function deleteGroup(id) {
  const group = state.groups.find((item) => item.id === id);
  if (!group) return;
  const athletesInGroup = state.athletes.filter((athlete) => athlete.groupId === id).length;
  if (athletesInGroup) {
    showToast("Diese Gruppe enthält noch Athleten.");
    return;
  }
  if (state.groups.length <= 1) {
    showToast("Mindestens eine Gruppe wird benötigt.");
    return;
  }
  state.groups = state.groups.filter((item) => item.id !== id);
  saveState();
  render();
}

async function deleteTeam(id) {
  const team = getTeam(id);
  if (!team) return;
  const assigned = state.athletes.filter((athlete) => athlete.teamId === id).length;
  if (assigned) {
    showToast("Diese Mannschaft enthält noch Athleten.");
    return;
  }

  if (serverMode) {
    try {
      const response = await fetch(`/api/teams/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        showToast(result.error || "Mannschaft konnte nicht entfernt werden.");
        return;
      }
      state = normalizeState(result.state);
      render();
      return;
    } catch (error) {
      showToast("Mannschaft konnte nicht am lokalen Server entfernt werden.");
      return;
    }
  }

  state.teams = getTeams().filter((item) => item.id !== id);
  saveState();
  render();
}

function editAthlete(id) {
  const athlete = findAthlete(id);
  if (!athlete) return;

  activeSetupView = "athletes";
  editingAthleteId = id;
  els.athleteName.value = athlete.name;
  els.athleteTeam.value = athlete.team || "";
  renderTeamSelect();
  els.athleteTeamId.value = athlete.teamId || "";
  els.athleteStart.value = athlete.startNo || "";
  els.athleteGroup.value = athlete.groupId || getOrderedGroups()[0]?.id || "";
  renderCategorySelect();
  els.athleteGender.value = normalizeGender(athlete.gender);
  renderAgeClassSelect();
  els.athleteAgeClass.value = normalizeAgeClass(athlete.ageClass);
  if (els.athleteBirthYear) els.athleteBirthYear.value = athlete.birthYear || "";
  renderWeightClassSelect();
  els.athleteWeightClass.value = athlete.weightClass || defaultWeightClassForSelection();
  els.athleteLot.value = athlete.lotNo || "";
  els.athleteEntryTotal.value = athlete.entryTotal || "";
  els.saveAthlete.textContent = "Athlet speichern";
  els.cancelEdit.classList.remove("hidden");
  renderAthleteBarHint();
  els.athleteName.focus();
}

function deleteAthlete(id) {
  const athlete = findAthlete(id);
  if (!athlete) return;
  if (!window.confirm(`${athlete.name} aus der Startliste entfernen?`)) return;

  state.athletes = state.athletes.filter((item) => item.id !== id);
  if (editingAthleteId === id) clearAthleteForm();
  saveState();
  render();
}

function toggleWithdrawn(id) {
  const athlete = findAthlete(id);
  if (!athlete) return;
  athlete.withdrawn = !athlete.withdrawn;
  saveState();
  syncPhase();
  render();
}

function clearAthleteForm() {
  editingAthleteId = null;
  els.athleteForm.reset();
  renderTeamSelect();
  els.athleteTeamId.value = "";
  els.athleteStart.value = nextStartNumber();
  els.athleteGroup.value = getOrderedGroups()[0]?.id || "";
  renderCategorySelect();
  els.athleteGender.value = defaultCategoryId();
  renderAgeClassSelect();
  els.athleteAgeClass.value = "senior";
  if (els.athleteBirthYear) els.athleteBirthYear.value = "";
  renderWeightClassSelect();
  els.saveAthlete.textContent = "Athlet hinzufügen";
  els.cancelEdit.classList.add("hidden");
  renderAthleteBarHint();
}

function openWeighInDialog(selectedId = null) {
  renderWeighInGroupFilter();
  const athletes = getWeighInAthletes();
  if (!athletes.length) {
    showToast("Bitte zuerst Athleten in dieser Gruppe anlegen.");
    return;
  }

  const selected = selectedId || els.weighAthlete.value || athletes[0].id;
  renderWeighInAthleteOptions(selected);
  loadWeighInAthlete(els.weighAthlete.value || athletes[0].id);
  if (typeof els.weighInDialog.showModal === "function") {
    els.weighInDialog.showModal();
  } else {
    els.weighInDialog.setAttribute("open", "");
  }
  els.weighAthlete.focus();
}

function closeWeighInDialog() {
  if (els.weighInDialog?.open) els.weighInDialog.close();
}

function getWeighInAthletes() {
  const groupId = els.weighGroupFilter?.value || "all";
  return groupId === "all"
    ? state.athletes
    : state.athletes.filter((athlete) => getAthleteGroupId(athlete) === groupId);
}

function renderWeighInGroupFilter() {
  if (!els.weighGroupFilter) return;
  const selected = els.weighGroupFilter.value || "all";
  const groups = getOrderedGroups();
  els.weighGroupFilter.innerHTML = [
    `<option value="all">Alle Gruppen</option>`,
    ...groups.map((group) => `<option value="${group.id}">Gruppe ${escapeHtml(group.name)}</option>`),
  ].join("");
  els.weighGroupFilter.value = selected === "all" || groups.some((group) => group.id === selected) ? selected : "all";
}

function weighInStatus(athlete) {
  const values = [athlete.bodyweight, athlete.openers?.snatch, athlete.openers?.cleanJerk];
  const filled = values.filter((value) => Number(value) > 0).length;
  if (filled === values.length) return "complete";
  if (filled > 0) return "partial";
  return "empty";
}

function weighInOptionStyle(status) {
  if (status === "complete") return "background:#dff4e7;color:#115c35;";
  if (status === "partial") return "background:#fff1c2;color:#6f4c00;";
  return "background:#ffffff;color:#192026;";
}

function renderWeighInAthleteOptions(selectedId) {
  const athletes = getWeighInAthletes();
  els.weighAthlete.innerHTML = athletes
    .map((athlete, index) => {
      const group = groupNameById(getAthleteGroupId(athlete));
      return `<option value="${athlete.id}">${index + 1}. ${escapeHtml(athlete.name)} · Gruppe ${escapeHtml(group)}</option>`;
    })
    .join("");
  Array.from(els.weighAthlete.options).forEach((option) => {
    const athlete = findAthlete(option.value);
    const status = athlete ? weighInStatus(athlete) : "empty";
    option.className = `weigh-status-${status}`;
    option.setAttribute("style", weighInOptionStyle(status));
  });
  els.weighAthlete.value = athletes.some((athlete) => athlete.id === selectedId) ? selectedId : athletes[0]?.id || "";
}

function loadWeighInAthlete(id) {
  const athlete = findAthlete(id);
  if (!athlete) {
    els.weighBodyweight.value = "";
    els.weighSnatch.value = "";
    els.weighCj.value = "";
    els.weighAthleteSummary.innerHTML = `<p class="muted">Kein Athlet ausgewählt.</p>`;
    return;
  }
  els.weighAthlete.value = athlete.id;
  els.weighBodyweight.value = athlete.bodyweight || "";
  els.weighSnatch.value = athlete.openers?.snatch || "";
  els.weighCj.value = athlete.openers?.cleanJerk || "";
  els.weighAthleteSummary.innerHTML = `
    <div><span>Gruppe</span><strong>${escapeHtml(groupNameById(getAthleteGroupId(athlete)))}</strong></div>
    <div><span>Verein</span><strong>${escapeHtml(athlete.team || "-")}</strong></div>
    <div><span>Kategorie</span><strong>${escapeHtml(genderLabel(athlete.gender))}</strong></div>
    <div><span>Altersklasse</span><strong>${escapeHtml(ageClassLabel(athlete.ageClass))}</strong></div>
    <div><span>Gewichtsklasse</span><strong>${escapeHtml(formatWeightClass(athlete.weightClass))}</strong></div>
    <div><span>Gemeldete ZK</span><strong>${formatMaybeKg(athlete.entryTotal)}</strong></div>
  `;
}

function saveWeighInFromForm(options = {}) {
  const athlete = findAthlete(els.weighAthlete.value);
  if (!athlete) return false;

  const bodyweight = parseOptionalPositiveFloat(els.weighBodyweight.value, "Körpergewicht");
  const snatch = parseOptionalPositiveInteger(els.weighSnatch.value, "Start Reißen");
  const cleanJerk = parseOptionalPositiveInteger(els.weighCj.value, "Start Stoßen");
  if (bodyweight === undefined || snatch === undefined || cleanJerk === undefined) return false;

  athlete.bodyweight = bodyweight;
  athlete.openers = { snatch, cleanJerk };
  if (state.meta.mode === "setup") {
    athlete.next = { snatch, cleanJerk };
  }

  saveState();
  render();
  renderWeighInAthleteOptions(athlete.id);
  loadWeighInAthlete(athlete.id);
  if (!options.silent) showToast("Waagedaten gespeichert.");
  return true;
}

function moveWeighInSelection(direction) {
  if (!saveWeighInFromForm({ silent: true })) return;
  const athletes = getWeighInAthletes();
  const currentIndex = athletes.findIndex((athlete) => athlete.id === els.weighAthlete.value);
  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), athletes.length - 1);
  if (nextIndex === currentIndex) {
    showToast(direction > 0 ? "Letzter Athlet erreicht." : "Erster Athlet erreicht.");
    return;
  }
  const nextAthlete = athletes[nextIndex];
  if (!nextAthlete) return;
  renderWeighInAthleteOptions(nextAthlete.id);
  loadWeighInAthlete(nextAthlete.id);
  showToast(direction > 0 ? "Gespeichert, nächster Athlet." : "Gespeichert, vorheriger Athlet.");
}

function parseOptionalPositiveFloat(value, label) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = parseFloatSafe(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    showToast(`${label} prüfen.`);
    return undefined;
  }
  return parsed;
}

function parseOptionalPositiveInteger(value, label) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = parseInteger(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    showToast(`${label} als ganzzahliges kg-Gewicht eintragen.`);
    return undefined;
  }
  return parsed;
}

function parseOptionalBirthYear(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = parseInteger(raw);
  if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) return null;
  return parsed;
}

function startCompetition() {
  const error = validateStartList();
  if (error) {
    showToast(error);
    return;
  }

  state.groups.forEach((group) => {
    group.completed = false;
    group.snatchCompleted = false;
    group.cleanJerkCompleted = false;
  });
  state.athletes.forEach((athlete) => {
    athlete.attempts = { snatch: [], cleanJerk: [] };
    athlete.next = {
      snatch: athlete.openers.snatch,
      cleanJerk: athlete.openers.cleanJerk,
    };
    athlete.nextChangeCounts = {};
  });
  state.meta.mode = "competition";
  state.meta.activeLift = "snatch";
  state.meta.activeGroupId = firstPendingGroupId();
  state.meta.sequence = 0;
  state.meta.breakPending = false;
  state.meta.startedAt = new Date().toISOString();

  judgeDraft = { key: null, votes: [null, null, null] };
  techniqueDraft = { key: null, points: [null, null, null] };
  plannedNextDraft = { key: null, weight: null };
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  ensureAttemptTimerForCurrent();
  saveState();
  render();
  openPlateWindow();
  openScoreboardWindow();
  openWaitingRoomDisplayWindow();
  void startYouTubeLiveIfConfigured();
}

function startCleanJerk() {
  const groupId = state.meta.activeGroupId || firstPendingGroupId();
  if (!groupId) {
    state.meta.mode = "finished";
    saveState();
    render();
    return;
  }

  state.meta.activeLift = "cleanJerk";
  state.meta.activeGroupId = groupId;
  state.meta.breakPending = false;
  state.meta.mode = "competition";
  athletesForGroup(groupId).forEach((athlete) => {
    if (!athlete.next.cleanJerk) athlete.next.cleanJerk = athlete.openers.cleanJerk;
  });
  judgeDraft = { key: null, votes: [null, null, null] };
  techniqueDraft = { key: null, points: [null, null, null] };
  plannedNextDraft = { key: null, weight: null };
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  ensureAttemptTimerForCurrent();
  saveState();
  render();
}

function startNextGroup() {
  const nextGroupId = firstPendingGroupId();
  if (!nextGroupId) {
    state.meta.mode = "finished";
    saveState();
    render();
    return;
  }

  state.meta.mode = "competition";
  state.meta.activeGroupId = nextGroupId;
  state.meta.activeLift = "snatch";
  state.meta.breakPending = false;
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  judgeDraft = state.meta.liveVotes;
  techniqueDraft = state.meta.liveTechnique;
  plannedNextDraft = { key: null, weight: null };
  ensureAttemptTimerForCurrent();
  saveState();
  render();
  openPlateWindow();
  openWaitingRoomDisplayWindow();
}

function resetCompetition() {
  if (!window.confirm("Wettkampfmodus beenden und zur Vorbereitung zurückkehren?")) return;

  state.meta.mode = "setup";
  state.meta.activeLift = "snatch";
  state.meta.activeGroupId = null;
  state.meta.breakPending = false;
  state.meta.sequence = 0;
  state.athletes.forEach((athlete) => {
    athlete.withdrawn = false;
    athlete.attempts = { snatch: [], cleanJerk: [] };
    athlete.next = {
      snatch: athlete.openers.snatch,
      cleanJerk: athlete.openers.cleanJerk,
    };
    athlete.nextChangeCounts = {};
  });
  state.groups.forEach((group) => {
    group.completed = false;
    group.snatchCompleted = false;
    group.cleanJerkCompleted = false;
  });
  judgeDraft = { key: null, votes: [null, null, null] };
  techniqueDraft = { key: null, points: [null, null, null] };
  plannedNextDraft = { key: null, weight: null };
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  ensureAttemptTimerForCurrent();
  saveState();
  render();
}

function resetAllData() {
  if (!window.confirm("Alle gespeicherten Daten dieser App löschen?")) return;
  state = emptyState();
  editingAthleteId = null;
  judgeDraft = { key: null, votes: [null, null, null] };
  techniqueDraft = { key: null, points: [null, null, null] };
  plannedNextDraft = { key: null, weight: null };
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  ensureAttemptTimerForCurrent();
  saveState();
  render();
}

function setJudgeVote(button) {
  const key = button.dataset.key;
  const index = Number(button.dataset.index);
  const value = button.dataset.value === "good";

  ensureDraftKey(key);
  state.meta.liveVotes.votes[index] = value;
  judgeDraft = state.meta.liveVotes;
  saveState();
  renderCurrentAttempt();
}

function clearJudgeVotes() {
  const key = judgeDraft.key || state.meta.liveVotes?.key || null;
  state.meta.liveVotes = { key, votes: [null, null, null] };
  state.meta.liveTechnique = { key, points: [null, null, null] };
  judgeDraft = state.meta.liveVotes;
  techniqueDraft = state.meta.liveTechnique;
  saveState();
  renderCurrentAttempt();
}

function resetJudgeConnections() {
  state.meta.judgeConnections = { solo: null, left: null, center: null, right: null };
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  judgeDraft = state.meta.liveVotes;
  techniqueDraft = state.meta.liveTechnique;
  if (sessionInfo) sessionInfo.judges = state.meta.judgeConnections;
}

async function rotateSessionCode() {
  if (!serverMode) {
    showToast("Ein neuer Code ist nur im Serverbetrieb möglich.");
    return;
  }

  if (!window.confirm("Neuen Verbindungscode erzeugen? Bereits verbundene Kampfrichter müssen den neuen QR-Code scannen.")) {
    return;
  }

  try {
    const response = await fetch("/api/session/rotate", { method: "POST" });
    if (!response.ok) throw new Error("rotate failed");
    sessionInfo = await response.json();
    if (sessionInfo?.judges) state.meta.judgeConnections = sessionInfo.judges;
    await loadServerState();
    showToast("Neuer Verbindungscode wurde erzeugt.");
    render();
  } catch (error) {
    showToast("Der Verbindungscode konnte nicht erneuert werden.");
  }
}

function recordCurrentAttempt() {
  if (state.meta.mode !== "competition" || state.meta.breakPending) return;

  const before = getCurrentAttempt();
  if (!before) return;

  const plannedNextInput = $("#planned-next-weight");
  const plannedNextWeight = plannedNextInput ? parseInteger(plannedNextInput.value) : null;
  const weightInput = $("#current-weight");
  if (weightInput) {
    const typedWeight = parseInteger(weightInput.value);
    if (!typedWeight) {
      showToast("Bitte ein gültiges Versuchsgewicht eintragen.");
      return;
    }
    before.athlete.next[before.lift] = typedWeight;
  }

  const current = getCurrentAttempt();
  if (!current) return;

  if (attemptKey(current) !== attemptKey(before)) {
    saveState();
    showToast("Die Reihenfolge wurde neu berechnet.");
    render();
    return;
  }

  const warning = nextWeightWarning(current.athlete, current.lift, current.weight);
  if (warning) {
    showToast(warning);
    render();
    return;
  }

  ensureDraftKey(attemptKey(current));
  const votes = state.meta.liveVotes.votes;
  const slots = getRefereeSlots();
  const activeVotes = slots.map((slot) => votes[slot.voteIndex]);
  if (activeVotes.some((vote) => vote === null)) {
    showToast(slots.length === 1 ? "Bitte die Kampfrichterstimme eintragen." : "Bitte alle drei Kampfrichterstimmen eintragen.");
    return;
  }

  const activeTechniquePoints = getActiveTechniquePoints(current, slots);
  if (shouldUseTechnique(current.athlete) && activeTechniquePoints.some((point) => point === null)) {
    showToast("Bitte die Technikpunkte für das Kind eintragen.");
    return;
  }

  const goodVotes = activeVotes.filter(Boolean).length;
  const isGoodAttempt = goodVotes >= getRequiredGoodVotes();
  if (current.attemptNo < 3 && !plannedNextWeight) {
    showToast("Bitte den nächsten Versuch eintragen.");
    render();
    return;
  }
  if (current.attemptNo < 3 && plannedNextWeight) {
    const minimumNextWeight = isGoodAttempt ? current.weight + 1 : current.weight;
    if (plannedNextWeight < minimumNextWeight) {
      showToast(`Nächster Versuch mindestens ${minimumNextWeight} kg.`);
      render();
      return;
    }
  }

  const attempt = {
    attemptNo: current.attemptNo,
    requestedWeight: current.weight,
    votes: { white: goodVotes, red: activeVotes.length - goodVotes },
    judges: [...activeVotes],
    techniquePoints: activeTechniquePoints,
    techniqueScore: calculateTechniqueScore(activeTechniquePoints),
    refereeCount: slots.length,
    good: isGoodAttempt,
    sequence: state.meta.sequence + 1,
    time: new Date().toISOString(),
  };

  state.meta.sequence = attempt.sequence;
  current.athlete.attempts[current.lift].push(attempt);

  if (current.attemptNo < 3) {
    const minimumNextWeight = attempt.good ? attempt.requestedWeight + 1 : attempt.requestedWeight;
    current.athlete.next[current.lift] = plannedNextWeight || minimumNextWeight;
  }

  judgeDraft = { key: null, votes: [null, null, null] };
  techniqueDraft = { key: null, points: [null, null, null] };
  plannedNextDraft = { key: null, weight: null };
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  syncPhase();
  setAttemptTimerForNext(current.athlete.id);
  saveState();
  render();
}

function undoLastAttempt() {
  const allAttempts = [];
  state.athletes.forEach((athlete) => {
    Object.keys(LIFTS).forEach((lift) => {
      athlete.attempts[lift].forEach((attempt) => {
        allAttempts.push({ athlete, lift, attempt });
      });
    });
  });

  allAttempts.sort((a, b) => b.attempt.sequence - a.attempt.sequence);
  const last = allAttempts[0];
  if (!last) {
    showToast("Es gibt noch keinen Versuch zum Zurücknehmen.");
    return;
  }

  last.athlete.attempts[last.lift].pop();
  state.meta.sequence = Math.max(0, state.meta.sequence - 1);
  state.meta.mode = "competition";
  state.meta.activeLift = last.lift;
  state.meta.activeGroupId = getAthleteGroupId(last.athlete);
  state.meta.breakPending = false;
  const group = state.groups.find((item) => item.id === state.meta.activeGroupId);
  if (group) {
    group.completed = false;
    if (last.lift === "snatch") group.snatchCompleted = false;
    if (last.lift === "cleanJerk") group.cleanJerkCompleted = false;
  }
  rebuildNextWeight(last.athlete, last.lift);
  judgeDraft = { key: null, votes: [null, null, null] };
  techniqueDraft = { key: null, points: [null, null, null] };
  plannedNextDraft = { key: null, weight: null };
  state.meta.liveVotes = { key: null, votes: [null, null, null] };
  state.meta.liveTechnique = { key: null, points: [null, null, null] };
  ensureAttemptTimerForCurrent();
  saveState();
  render();
}

function render() {
  syncPhase();
  applyScoringModeTheme(getScoringMode());
  renderHeader();
  renderSetup();
  renderCompetition();
}

function renderHeader() {
  const parts = [state.meta.eventName, state.meta.category, state.meta.group && `Plattform ${state.meta.group}`]
    .filter(Boolean)
    .join(" · ");
  els.eventSummary.textContent = parts || "Lokaler Wettkampf";
  const toggle = document.querySelector(".iwf-toggle");
  if (toggle) toggle.classList.toggle("hidden", state.meta.mode !== "setup");
  if (els.iwfRulesEnabled) els.iwfRulesEnabled.checked = isIwfMode();
  if (els.youtubeEndStream) {
    const youtube = sessionInfo?.youtube || {};
    els.youtubeEndStream.classList.toggle("hidden", !["starting", "live", "stopping"].includes(youtube.status));
  }
  renderStreamTopStatus();
  renderTopCameraPreview();
  renderActiveLogos();
}

function getYouTubeUiStatus() {
  const youtube = youtubePayload();
  const ffmpegMissing = youtube.connected && youtube.ffmpegFound === false;
  const ready = youtube.connected && !ffmpegMissing && !["error", "starting", "live", "stopping", "paused"].includes(youtube.status);
  const liveNotEnabled = isYouTubeLiveNotEnabledError(youtube.error);
  const map = {
    idle: ffmpegMissing ? { label: "FFmpeg fehlt", tone: "danger" } : { label: "Bereit", tone: "ok" },
    starting: { label: "Startet", tone: "warning" },
    live: { label: "Live", tone: "live" },
    paused: { label: "Pausiert", tone: "paused" },
    stopping: { label: "Beendet", tone: "warning" },
    complete: { label: "Bereit", tone: "ok" },
    error: { label: liveNotEnabled ? "Live nicht freigeschaltet" : "Fehler", tone: "danger" },
  };
  if (!youtube.connected) return { label: "nicht verbunden", tone: "neutral", ffmpegMissing, ready, youtube };
  const status = map[youtube.status] || { label: youtube.status || "Status offen", tone: "neutral" };
  return { ...status, ffmpegMissing, ready, youtube, liveNotEnabled };
}

function isYouTubeLiveNotEnabledError(message) {
  const normalized = String(message || "").toLowerCase();
  return normalized.includes("not enabled for live streaming") || normalized.includes("noch nicht freigeschaltet");
}

function renderStreamTopStatus() {
  if (!els.streamStatusTop || !els.streamStatusTopLabel) return;
  const status = getYouTubeUiStatus();
  els.streamStatusTopLabel.textContent = `Stream: ${status.label}`;
  els.streamStatusTop.classList.remove("ok", "live", "paused", "warning", "danger");
  if (status.tone && status.tone !== "neutral") els.streamStatusTop.classList.add(status.tone);
}

function renderTopCameraPreview() {
  if (!els.topCameraPreview || !els.topCameraVideo) return;
  const visible = state.meta.mode !== "setup" && Boolean(youtubeMediaStream);
  els.topCameraPreview.classList.toggle("hidden", !visible);
  els.topCameraPreview.classList.toggle("active", visible);
  if (visible) {
    setVideoElementStream(els.topCameraVideo, youtubeMediaStream);
  } else if (els.topCameraVideo.srcObject) {
    els.topCameraVideo.srcObject = null;
  }
  els.topCameraEmpty?.classList.toggle("hidden", visible);
}

function setVideoElementStream(video, stream) {
  if (!video) return;
  if (video.srcObject !== stream) video.srcObject = stream || null;
  if (stream) video.play?.().catch(() => {});
}

function renderSetup() {
  const isSetup = state.meta.mode === "setup";
  els.setupPanel.classList.toggle("hidden", !isSetup);
  if (!isSetup) {
    if (els.connectionPanel) els.connectionPanel.classList.add("hidden");
    return;
  }

  els.eventName.value = state.meta.eventName || "";
  els.eventCategory.value = state.meta.category || "";
  els.eventGroup.value = state.meta.group || "A";
  els.refereeCount.value = String(getRefereeCount());
  els.refereeCount.disabled = isIwfMode();
  if (els.iwfRulesEnabled) els.iwfRulesEnabled.checked = isIwfMode();
  if (els.childTechniqueEnabled) els.childTechniqueEnabled.checked = Boolean(state.meta.childTechniqueEnabled);
  renderGroupSelect();
  renderTeamSelect();
  renderCategorySelect();
  renderAgeClassSelect();
  renderWeightClassSelect();
  renderGroups();
  renderTeams();
  renderAthleteBarHint();
  if (!editingAthleteId && !els.athleteStart.value) els.athleteStart.value = nextStartNumber();
  renderConnection();
  renderSetupViewContent();
  renderSetupViews();

  if (!state.athletes.length) {
    els.athletesTable.innerHTML = `<tr><td colspan="15" class="muted">Noch keine Athleten erfasst.</td></tr>`;
    return;
  }

  els.athletesTable.innerHTML = state.athletes
    .map((athlete) => {
      const warning = athleteSetupWarning(athlete);
      return `
        <tr>
          <td><strong>${escapeHtml(athlete.name)}</strong></td>
          <td>${escapeHtml(athlete.team || "-")}</td>
          <td>${escapeHtml(teamNameById(athlete.teamId))}</td>
          <td>${escapeHtml(groupNameById(athlete.groupId))}</td>
          <td>${escapeHtml(genderLabel(athlete.gender))}</td>
          <td>${escapeHtml(ageClassLabel(athlete.ageClass))}</td>
          <td>${athlete.birthYear || "-"}</td>
          <td>${escapeHtml(formatWeightClass(athlete.weightClass))}</td>
          <td>${formatMaybeKg(athlete.entryTotal)}</td>
          <td>${barWeightForAthlete(athlete)} kg</td>
          <td>${formatBodyweight(athlete.bodyweight)}</td>
          <td>${formatMaybeKg(athlete.openers?.snatch)}</td>
          <td>${formatMaybeKg(athlete.openers?.cleanJerk)}</td>
          <td class="${warning ? "warning-text" : "ok-text"}">${warning || "bereit"}</td>
          <td>
            <div class="row-actions">
              <button type="button" class="mini-button" data-action="edit-athlete" data-id="${athlete.id}">Bearbeiten</button>
              <button type="button" class="mini-button" data-action="delete-athlete" data-id="${athlete.id}">Entfernen</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function setSetupView(view) {
  const allowed = getAllowedSetupViews();
  activeSetupView = allowed.includes(view) ? view : "competition";
  if (activeSetupView === "guided") guidedSetupReturnActive = false;
  renderSetupViewContent();
  renderSetupViews();
  if (activeSetupView === "youtube") void refreshYouTubeDevices({ requestPermission: false });
}

function renderSetupViews() {
  const allowed = getAllowedSetupViews();
  if (!allowed.includes(activeSetupView)) activeSetupView = allowed[0] || "competition";
  document.querySelectorAll("[data-setup-view]").forEach((section) => {
    const visible = allowed.includes(section.dataset.setupView);
    section.classList.toggle("hidden", !visible);
    section.classList.toggle("active", visible && section.dataset.setupView === activeSetupView);
  });
  document.querySelectorAll(".setup-nav-button[data-view]").forEach((button) => {
    const visible = allowed.includes(button.dataset.view);
    button.classList.toggle("hidden", !visible);
    button.classList.toggle("active", visible && button.dataset.view === activeSetupView);
  });
}

function getAllowedSetupViews() {
  return isIwfMode() ? IWF_SETUP_VIEWS : CLUB_SETUP_VIEWS;
}

function renderSetupViewContent() {
  renderGuidedReturnBar();
  if (activeSetupView === "guided") renderGuidedSetup();
  if (activeSetupView === "athletes") {
    renderGroupSelect();
    renderTeamSelect();
    renderCategorySelect();
    renderAgeClassSelect();
    renderWeightClassSelect();
    renderAthleteBarHint();
  }
  if (activeSetupView === "relative") renderRelativeTable();
  if (activeSetupView === "ageFactor") renderAgeFactorTable();
  if (activeSetupView === "categories") renderCategorySettings();
  if (activeSetupView === "plates") renderPlateSettings();
  if (activeSetupView === "teams") renderTeams();
  if (activeSetupView === "youtube") renderYouTubeSettings();
}

function renderGuidedSetup() {
  if (!els.guidedSetupPanel) return;
  const steps = getGuidedSetupSteps();
  if (!steps.length) return;
  guidedSetupStepIndex = Math.min(Math.max(guidedSetupStepIndex, 0), steps.length - 1);
  const step = steps[guidedSetupStepIndex];
  const isLast = guidedSetupStepIndex === steps.length - 1;
  const startWarning = isLast ? validateStartList() : "";
  const progress = Math.round(((guidedSetupStepIndex + 1) / steps.length) * 100);
  const modeChooser =
    step.id === "mode"
      ? `
        <div class="guided-mode-grid" role="group" aria-label="Regelmodus">
          <button type="button" class="guided-mode-button ${!isIwfMode() ? "active" : ""}" data-action="guided-set-mode" data-mode="${SCORING_MODES.CLUB}">
            <strong>Vereinsmodus</strong>
            <span>Relativabzug, Altersfaktor, Technik und Mannschaftswertung nach Vereinslogik.</span>
          </button>
          <button type="button" class="guided-mode-button ${isIwfMode() ? "active" : ""}" data-action="guided-set-mode" data-mode="${SCORING_MODES.IWF}">
            <strong>IWF Modus</strong>
            <span>Internationale Wertung mit Total, Gewichtsklassen und 3 Kampfrichtern.</span>
          </button>
        </div>
      `
      : "";
  const openButton = step.view
    ? `<button type="button" class="ghost-button" data-action="guided-open-view" data-view="${escapeHtml(step.view)}">Hier pruefen / bearbeiten</button>`
    : "";

  els.guidedSetupPanel.innerHTML = `
    <div class="guided-setup-window">
      <div class="guided-progress-row">
        <span class="eyebrow">Begleitete Einrichtung</span>
        <span class="status-pill">${guidedSetupStepIndex + 1} / ${steps.length}</span>
      </div>
      <div class="guided-progress-bar" aria-hidden="true">
        <span style="width:${progress}%"></span>
      </div>
      <div class="guided-step-layout">
        <aside class="guided-step-list" aria-label="Einrichtungsschritte">
          ${steps
            .map(
              (item, index) => `
                <div class="guided-step-pill ${index === guidedSetupStepIndex ? "active" : ""} ${index < guidedSetupStepIndex ? "done" : ""}">
                  <span>${index + 1}</span>
                  <strong>${escapeHtml(item.shortTitle || item.title)}</strong>
                </div>
              `,
            )
            .join("")}
        </aside>
        <section class="guided-step-card">
          <p class="eyebrow">${escapeHtml(step.eyebrow || "Naechster Schritt")}</p>
          <h3>${escapeHtml(step.title)}</h3>
          <div class="guided-hint">
            <strong>Hinweis</strong>
            <p>${escapeHtml(step.hint)}</p>
          </div>
          ${modeChooser}
          <div class="guided-checklist">
            ${step.checks
              .map(
                (check) => `
                  <div class="guided-check ${check.status || "open"}">
                    <span aria-hidden="true"></span>
                    <div>
                      <strong>${escapeHtml(check.label)}</strong>
                      <p>${escapeHtml(check.detail || "")}</p>
                    </div>
                  </div>
                `,
              )
              .join("")}
          </div>
          ${isLast && startWarning ? `<p class="warning-text">${escapeHtml(startWarning)}</p>` : ""}
          <div class="guided-actions">
            <button type="button" class="ghost-button" data-action="guided-cancel">Abbrechen</button>
            <button type="button" class="ghost-button" data-action="guided-prev" ${guidedSetupStepIndex === 0 ? "disabled" : ""}>Zurueck</button>
            ${openButton}
            ${
              isLast
                ? `<button type="button" class="primary-button" data-action="guided-start-competition" ${startWarning ? "disabled" : ""}>Wettkampf starten</button>`
                : `<button type="button" class="primary-button" data-action="guided-next">Weiter</button>`
            }
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderGuidedReturnBar() {
  if (!els.guidedReturnBar) return;
  const steps = getGuidedSetupSteps();
  const step = steps[Math.min(Math.max(guidedSetupStepIndex, 0), Math.max(steps.length - 1, 0))];
  const visible = state.meta.mode === "setup" && guidedSetupReturnActive && activeSetupView !== "guided" && Boolean(step);
  els.guidedReturnBar.classList.toggle("hidden", !visible);
  if (!visible) {
    els.guidedReturnBar.innerHTML = "";
    return;
  }
  els.guidedReturnBar.innerHTML = `
    <div>
      <p class="eyebrow">Begleitete Einrichtung</p>
      <strong>Schritt ${guidedSetupStepIndex + 1} von ${steps.length}: ${escapeHtml(step.title)}</strong>
      <p>${escapeHtml(step.hint)}</p>
    </div>
    <div class="guided-return-actions">
      <button type="button" class="ghost-button" data-action="guided-prev" ${guidedSetupStepIndex === 0 ? "disabled" : ""}>Zurueck</button>
      <button type="button" class="primary-button" data-action="guided-return-next">${guidedSetupStepIndex >= steps.length - 1 ? "Startpruefung anzeigen" : "Weiter"}</button>
      <button type="button" class="ghost-button" data-action="guided-return">Assistent verlassen</button>
    </div>
  `;
}

function getGuidedSetupSteps() {
  const clubMode = !isIwfMode();
  return [
    guidedModeStep(),
    guidedCompetitionStep(),
    guidedCategoriesStep(),
    guidedPlatesStep(),
    clubMode ? guidedRelativeStep() : null,
    clubMode ? guidedAgeFactorStep() : null,
    guidedAthleteDataStep(),
    guidedWeighInStep(),
    guidedTeamsStep(),
    guidedNetworkStep(),
    guidedLivestreamStep(),
    guidedStartStep(),
  ].filter(Boolean);
}

function guidedModeStep() {
  return {
    id: "mode",
    title: "Regelmodus festlegen",
    shortTitle: "Modus",
    hint: "Waehle zuerst, ob dieser Wettkampf mit der Vereinswertung oder nach IWF Regeln laufen soll. Diese Auswahl steuert danach die benoetigten Reiter und Pruefungen.",
    checks: [
      guidedCheck("Aktueller Modus", "ok", isIwfMode() ? "IWF Regeln aktiv. Es werden 3 Kampfrichter verwendet." : "Vereinsmodus aktiv. Relativwertung und Technik koennen genutzt werden."),
      guidedCheck("Wechsel nur vor Wettkampfbeginn", state.meta.mode === "setup" ? "ok" : "warn", "Nach dem Start bleibt der Regelmodus fest, damit Ergebnisse eindeutig bleiben."),
    ],
  };
}

function guidedCompetitionStep() {
  const groups = getOrderedGroups();
  return {
    id: "competition",
    view: "competition",
    title: "Wettkampf und Gruppen pruefen",
    shortTitle: "Gruppen",
    hint: "Trage den Wettkampfnamen, die Wettkampfklasse und die Plattform ein. Lege dann alle Gruppen in der Reihenfolge an, in der sie auf der Plattform starten.",
    checks: [
      guidedCheck("Wettkampfname", state.meta.eventName ? "ok" : "open", state.meta.eventName || "Noch keinen Wettkampfnamen eingetragen."),
      guidedCheck("Wettkampfklasse", state.meta.category ? "ok" : "open", state.meta.category || "Zum Beispiel Masters, Jugend oder eine konkrete Gewichtsklasse."),
      guidedCheck("Plattform", state.meta.group ? "ok" : "open", state.meta.group || "Plattformnummer oder Plattformname eintragen."),
      guidedCheck("Gruppen", groups.length ? "ok" : "open", groups.length ? `${groups.length} Gruppe(n) angelegt: ${groups.map((group) => group.name).join(", ")}` : "Mindestens eine Gruppe anlegen."),
      guidedCheck("Kinder-Technik", isIwfMode() || state.meta.childTechniqueEnabled ? "ok" : "warn", isIwfMode() ? "Im IWF Modus deaktiviert." : "Nur aktivieren, wenn Kinder mit Technikwertung bewertet werden sollen."),
    ],
  };
}

function guidedCategoriesStep() {
  const categories = getCategories();
  const complete = categories.every((category) => category.label && Number(category.barWeight) > 0 && category.weightClassType);
  return {
    id: "categories",
    view: "categories",
    title: "Geschlechter und Kategorien kontrollieren",
    shortTitle: "Kategorien",
    hint: "Pruefe, ob alle auswaehlbaren Kategorien stimmen. Das Stangengewicht, Technikwertung, Gewichtsklassen und Verschluesse wirken spaeter direkt auf Waage, Scheibenanzeige und Ergebnis.",
    checks: [
      guidedCheck("Kategorien vorhanden", categories.length ? "ok" : "open", `${categories.length} Kategorie(n) angelegt.`),
      guidedCheck("Stangengewichte", complete ? "ok" : "open", complete ? "Alle Kategorien haben Stange und Gewichtsklasse." : "Mindestens eine Kategorie ist unvollstaendig."),
      guidedCheck("Technikwertung", isIwfMode() ? "ok" : "warn", isIwfMode() ? "Im IWF Modus wird Technik nicht gewertet." : "Bei Kindern gezielt pruefen, ob Technik aktiv sein soll."),
      guidedCheck("Verschluesse", "warn", "Pruefe, ob pro Kategorie die Scheibenverschluesse korrekt beruecksichtigt werden."),
    ],
  };
}

function guidedPlatesStep() {
  const plates = Array.isArray(state.plates) ? state.plates : [];
  const complete = plates.length && plates.every((plate) => Number(plate.weight) > 0 && Number(plate.size) > 0 && String(plate.color || "").trim());
  return {
    id: "plates",
    view: "plates",
    title: "Gewichtscheiben pruefen",
    shortTitle: "Scheiben",
    hint: "Kontrolliere Scheibengewicht, Farbe und Groesse. Genau diese Liste wird fuer die Scheibensteckeranzeige verwendet.",
    checks: [
      guidedCheck("Scheibenbestand", plates.length ? "ok" : "open", `${plates.length} Scheibentyp(en) hinterlegt.`),
      guidedCheck("Farbe und Groesse", complete ? "ok" : "open", complete ? "Alle Scheiben haben Gewicht, Farbe und Groesse." : "Mindestens eine Scheibe ist unvollstaendig."),
      guidedCheck("Reihenfolge", "warn", "Schwere Scheiben sollten groesser sein als leichte Scheiben, damit die Anzeige realistisch wirkt."),
    ],
  };
}

function guidedRelativeStep() {
  const keys = ["male", "female", "child"];
  const complete = keys.every((key) => Array.isArray(state.relativeTables?.[key]) && state.relativeTables[key].length);
  return {
    id: "relative",
    view: "relative",
    title: "Relativabzug kontrollieren",
    shortTitle: "Relativ",
    hint: "Pruefe die Relativabzugstabellen fuer Mann, Frau und Kind. Diese Werte bestimmen die Vereinswertung und Ergebnisliste.",
    checks: keys.map((key) =>
      guidedCheck(relativeTableLabel(key), Array.isArray(state.relativeTables?.[key]) && state.relativeTables[key].length ? "ok" : "open", `${state.relativeTables?.[key]?.length || 0} Zeilen hinterlegt.`),
    ).concat([guidedCheck("Berechnung", complete ? "ok" : "open", complete ? "Relativtabellen sind vorhanden." : "Eine Tabelle fehlt noch.")]),
  };
}

function guidedAgeFactorStep() {
  const maleRows = state.ageFactors?.male?.length || 0;
  const femaleRows = state.ageFactors?.female?.length || 0;
  return {
    id: "ageFactor",
    view: "ageFactor",
    title: "Altersfaktor fuer Masters pruefen",
    shortTitle: "Masters",
    hint: "Kontrolliere die Altersfaktoren fuer Masters. Sie werden ueber Jahrgang, aktuelles Datum und Geschlecht in der Ergebniswertung verwendet.",
    checks: [
      guidedCheck("Mann", maleRows ? "ok" : "open", `${maleRows} Alterswerte hinterlegt.`),
      guidedCheck("Frau", femaleRows ? "ok" : "open", `${femaleRows} Alterswerte hinterlegt.`),
      guidedCheck("Jahrgaenge", "warn", "Bei Masters-Athleten muss der Jahrgang eingetragen sein."),
    ],
  };
}

function guidedAthleteDataStep() {
  const athletes = state.athletes || [];
  const complete = athletes.every((athlete) => athlete.name && athlete.groupId && athlete.gender && athlete.ageClass && athlete.weightClass);
  return {
    id: "athletes",
    view: "athletes",
    title: "Meldedaten erfassen",
    shortTitle: "Meldung",
    hint: "Erfasse alle gemeldeten Athleten mit Name, Verein, Mannschaft, Gruppe, Kategorie, Altersklasse, Jahrgang und gemeldeter Gewichtsklasse. Waagedaten koennen spaeter ergaenzt werden.",
    checks: [
      guidedCheck("Athleten angelegt", athletes.length ? "ok" : "open", athletes.length ? `${athletes.length} Athlet(en) angelegt.` : "Noch keine Athleten angelegt."),
      guidedCheck("Meldedaten vollstaendig", athletes.length && complete ? "ok" : "open", athletes.length && complete ? "Alle Meldedaten sind ausgefuellt." : "Mindestens ein Athlet hat noch fehlende Meldedaten."),
      guidedCheck("Gruppenzuordnung", athletes.every((athlete) => getAthleteGroupId(athlete)) ? "ok" : "open", "Jeder Athlet muss einer Gruppe zugeordnet sein."),
    ],
  };
}

function guidedWeighInStep() {
  const athletes = state.athletes || [];
  const complete = athletes.length && athletes.every((athlete) => athlete.bodyweight && athlete.openers?.snatch && athlete.openers?.cleanJerk);
  const partial = athletes.filter((athlete) => athlete.bodyweight || athlete.openers?.snatch || athlete.openers?.cleanJerk).length;
  return {
    id: "weighIn",
    view: "athletes",
    title: "Waage und Anfangsgewichte eintragen",
    shortTitle: "Waage",
    hint: "Oeffne die Waage und trage Koerpergewicht, Startgewicht Reissen und Startgewicht Stossen ein. Spaetere Gruppen koennen auch waehrend des Wettkampfs weiter gewogen werden.",
    checks: [
      guidedCheck("Waagedaten vollstaendig", complete ? "ok" : "open", complete ? "Alle Athleten haben Waagedaten." : `${partial} von ${athletes.length} Athlet(en) haben mindestens einen Waagewert.`),
      guidedCheck("Startgewichte", complete ? "ok" : "open", "Reissen und Stossen muessen vor dem Start fuer alle anwesenden Athleten gefuellt sein."),
      guidedCheck("Fehlende Athleten", "warn", "Nicht erschienene Athleten koennen an der Waage als fehlend markiert werden, solange ihre Gruppe noch nicht aktiv ist."),
    ],
  };
}

function guidedTeamsStep() {
  const teams = state.teams || [];
  const assigned = state.athletes.filter((athlete) => athlete.teamId).length;
  return {
    id: "teams",
    view: "teams",
    title: "Mannschaften pruefen",
    shortTitle: "Teams",
    hint: "Falls eine Mannschaftswertung benoetigt wird, lege Mannschaften an und ordne Athleten zu. Wenn keine Mannschaftswertung gebraucht wird, kann dieser Schritt nur kontrolliert werden.",
    checks: [
      guidedCheck("Mannschaften", teams.length ? "ok" : "warn", teams.length ? `${teams.length} Mannschaft(en) angelegt.` : "Keine Mannschaft angelegt. Das ist in Ordnung, wenn keine Mannschaftswertung benoetigt wird."),
      guidedCheck("Zuordnung", assigned ? "ok" : "warn", assigned ? `${assigned} Athlet(en) einer Mannschaft zugeordnet.` : "Keine Athleten einer Mannschaft zugeordnet."),
    ],
  };
}

function guidedNetworkStep() {
  const judges = sessionInfo?.judges || state.meta.judgeConnections || {};
  const slots = getRefereeSlots();
  const connectedJudges = slots.filter((slot) => judges[slot.key]).length;
  const displayClients = Array.isArray(sessionInfo?.displayClients) ? sessionInfo.displayClients.length : 0;
  return {
    id: "network",
    view: "network",
    title: "Netzwerk und Anzeigen verbinden",
    shortTitle: "Netzwerk",
    hint: "Pruefe Verbindungscode, Kampfrichter-Handys, Waage, Warteraum und die Bildschirmzuordnung fuer Scheibenstecker-, Protokoll- und Warteraumanzeige.",
    checks: [
      guidedCheck("Verbindungscode", sessionInfo?.code ? "ok" : "open", sessionInfo?.code ? `Aktueller Code: ${sessionInfo.code}` : "Servercode noch nicht geladen."),
      guidedCheck("Kampfrichter", connectedJudges === slots.length ? "ok" : "warn", `${connectedJudges} von ${slots.length} Kampfrichter(n) verbunden.`),
      guidedCheck("Waage und Warteraum", "warn", "Bei Bedarf Waage und Warteraum ueber den Link im gleichen WLAN anmelden."),
      guidedCheck("Bildschirme", displayClients ? "ok" : "warn", displayClients ? `${displayClients} Anzeigeclient(s) verbunden.` : "Scheibenstecker-/Warteraum-/Protokollfenster vor Ort pruefen."),
    ],
  };
}

function guidedLivestreamStep() {
  const youtube = youtubePayload();
  const enabled = Boolean(youtube.settings?.enabled);
  return {
    id: "youtube",
    view: "youtube",
    title: "Livestream einstellen",
    shortTitle: "Stream",
    hint: "Wenn gestreamt werden soll: YouTube verbinden, FFmpeg pruefen, Kamera und Mikrofon waehlen und die Kameravorschau kontrollieren. Wenn kein Stream benoetigt wird, Livestream deaktiviert lassen.",
    checks: [
      guidedCheck("Livestream aktiviert", enabled ? "ok" : "warn", enabled ? "Livestream startet beim Wettkampfstart automatisch." : "Livestream ist deaktiviert und wird uebersprungen."),
      guidedCheck("YouTube Verbindung", !enabled || youtube.connected ? "ok" : "open", youtube.connected ? "YouTube ist verbunden." : "Mit YouTube verbinden, wenn gestreamt werden soll."),
      guidedCheck("FFmpeg", !enabled || youtube.ffmpegFound ? "ok" : "open", youtube.ffmpegFound ? "FFmpeg wurde gefunden." : "FFmpeg automatisch einrichten oder Pfad eintragen."),
      guidedCheck("Kamera/Mikrofon", !enabled || youtube.settings?.cameraDeviceId ? "ok" : "warn", youtube.settings?.cameraLabel || "Kamera und Mikrofon im Reiter Livestream pruefen."),
      guidedCheck("YouTube Live", youtube.status === "error" ? "warn" : "ok", youtube.error || "Kein aktueller YouTube-Fehler gemeldet."),
    ],
  };
}

function guidedStartStep() {
  const startWarning = validateStartList();
  return {
    id: "start",
    view: "athletes",
    title: "Letzte Pruefung und Wettkampfstart",
    shortTitle: "Start",
    hint: "Pruefe Meldeliste, Starterlisten, Waagewerte, Kampfrichter und Anzeigen ein letztes Mal. Wenn keine Warnung mehr angezeigt wird, kann der Wettkampf gestartet werden.",
    checks: [
      guidedCheck("Startliste", startWarning ? "open" : "ok", startWarning || "Alle Pflichtdaten sind vorhanden."),
      guidedCheck("Listen", "warn", "Meldeliste und Starterlisten koennen oben in der Menueleiste erzeugt und ausgedruckt werden."),
      guidedCheck("Sicherungen", "ok", "Nach jedem Versuch wird automatisch gesichert."),
    ],
  };
}

function guidedCheck(label, status, detail) {
  return { label, status: status || "open", detail };
}

function relativeTableLabel(key) {
  if (key === "female") return "Frau";
  if (key === "child") return "Kind";
  return "Mann";
}

function guidedSetupNext() {
  moveGuidedSetupStep(1);
}

function guidedSetupPrev() {
  moveGuidedSetupStep(-1);
}

function moveGuidedSetupStep(direction) {
  const steps = getGuidedSetupSteps();
  if (!steps.length) return;
  const lastIndex = Math.max(steps.length - 1, 0);
  const nextIndex = Math.min(Math.max(guidedSetupStepIndex + direction, 0), lastIndex);
  const unchangedAtEnd = guidedSetupReturnActive && direction > 0 && guidedSetupStepIndex >= lastIndex;
  guidedSetupStepIndex = nextIndex;
  if (unchangedAtEnd) {
    guidedSetupReturnActive = false;
    setSetupView("guided");
    return;
  }
  if (guidedSetupReturnActive && activeSetupView !== "guided") {
    showGuidedStepWorkView();
    return;
  }
  renderGuidedSetup();
}

function guidedSetupCancel() {
  guidedSetupReturnActive = false;
  guidedSetupStepIndex = 0;
  setSetupView("competition");
}

function guidedSetupOpenView(view) {
  const allowed = getAllowedSetupViews();
  if (!allowed.includes(view)) return;
  guidedSetupReturnActive = true;
  setSetupView(view);
}

function guidedSetupReturn() {
  guidedSetupReturnActive = false;
  renderSetupViewContent();
}

function showGuidedStepWorkView() {
  const steps = getGuidedSetupSteps();
  const step = steps[Math.min(Math.max(guidedSetupStepIndex, 0), Math.max(steps.length - 1, 0))];
  const allowed = getAllowedSetupViews();
  if (step?.view && allowed.includes(step.view)) {
    activeSetupView = step.view;
    renderSetupViewContent();
    renderSetupViews();
    if (activeSetupView === "youtube") void refreshYouTubeDevices({ requestPermission: false });
    return;
  }
  guidedSetupReturnActive = false;
  setSetupView("guided");
}

function guidedSetupSetMode(mode) {
  setScoringMode(mode);
  guidedSetupReturnActive = false;
  guidedSetupStepIndex = 0;
  activeSetupView = "guided";
  render();
}

function youtubePayload() {
  return sessionInfo?.youtube || { connected: false, status: "idle", settings: {} };
}

function renderYouTubeSettings() {
  if (!els.youtubeForm) return;
  const youtube = youtubePayload();
  const settings = youtube.settings || {};
  const active = document.activeElement;
  if (!active?.closest?.("#youtube-form")) {
    els.youtubeEnabled.checked = Boolean(settings.enabled);
    els.youtubeClientId.value = settings.clientId || "";
    els.youtubeClientSecret.value = "";
    els.youtubePrivacy.value = settings.privacyStatus || "unlisted";
    els.youtubeTitle.value = settings.titleTemplate || "{event} - Livestream";
    els.youtubeFfmpegPath.value = settings.ffmpegPath || "";
    renderYouTubeDeviceSelects(settings);
  }
  renderYouTubeStatusOnly();
  scheduleYouTubePreviewStart();
}

function renderYouTubeStatusOnly() {
  if (!els.youtubeStatusPill) return;
  const status = getYouTubeUiStatus();
  const { youtube, ffmpegMissing, ready } = status;
  const label = status.label;
  els.youtubeStatusPill.textContent = youtube.connected ? label : "nicht verbunden";
  els.youtubeStatusPill.classList.toggle("ok", ready || youtube.status === "live");
  els.youtubeStatusPill.classList.toggle("danger", youtube.status === "error" || ffmpegMissing);
  els.youtubeStatusBox?.classList.toggle("ok", ready || youtube.status === "live");
  els.youtubeStatusBox?.classList.toggle("danger", youtube.status === "error" || ffmpegMissing);
  if (els.youtubeStatusTitle) {
    els.youtubeStatusTitle.textContent = youtube.connected ? label : "Nicht verbunden";
  }
  if (els.youtubeStatusText) {
    const notes = [];
    if (!serverMode) notes.push("YouTube Live ist nur in der installierten lokalen Server-App verfuegbar.");
    if (!youtube.connected) notes.push("Google OAuth Client-ID und Client Secret eintragen und danach mit YouTube verbinden.");
    if (ffmpegMissing) {
      notes.push("YouTube ist verbunden. FFmpeg fehlt noch. Nutze den Button FFmpeg automatisch einrichten.");
    }
    if (youtube.status === "live") notes.push("Livestream laeuft. Er endet erst ueber den Button Livestream beenden.");
    if (youtube.error) notes.push(youtube.error);
    els.youtubeStatusText.textContent = notes.join(" ") || "Bereit. Kamera und Mikrofon waehlen, dann kann der Livestream beim Wettkampfstart automatisch beginnen.";
  }
  if (els.youtubeWatchUrl) {
    els.youtubeWatchUrl.innerHTML = youtube.watchUrl
      ? `<a href="${escapeHtml(youtube.watchUrl)}" target="_blank" rel="noreferrer">${escapeHtml(youtube.watchUrl)}</a>`
      : "";
  }
  renderStreamTopStatus();
}

function renderYouTubeDeviceSelects(settings = {}) {
  if (!els.youtubeCamera || !els.youtubeMicrophone) return;
  const currentCamera = els.youtubeCamera.value || settings.cameraDeviceId || "";
  const currentMic = els.youtubeMicrophone.value || settings.microphoneDeviceId || "";
  const cameraOptions = [...youtubeDevices.cameras];
  const micOptions = [...youtubeDevices.microphones];
  if (settings.cameraDeviceId && !cameraOptions.some((device) => device.deviceId === settings.cameraDeviceId)) {
    cameraOptions.push({ deviceId: settings.cameraDeviceId, label: settings.cameraLabel || "Gespeicherte Kamera" });
  }
  if (settings.microphoneDeviceId && !micOptions.some((device) => device.deviceId === settings.microphoneDeviceId)) {
    micOptions.push({ deviceId: settings.microphoneDeviceId, label: settings.microphoneLabel || "Gespeichertes Mikrofon" });
  }
  els.youtubeCamera.innerHTML = [
    `<option value="">Standardkamera</option>`,
    ...cameraOptions.map((device, index) => {
      const label = device.label || `Kamera ${index + 1}`;
      return `<option value="${escapeHtml(device.deviceId)}">${escapeHtml(label)}</option>`;
    }),
  ].join("");
  els.youtubeMicrophone.innerHTML = [
    `<option value="">Standardmikrofon</option>`,
    ...micOptions.map((device, index) => {
      const label = device.label || `Mikrofon ${index + 1}`;
      return `<option value="${escapeHtml(device.deviceId)}">${escapeHtml(label)}</option>`;
    }),
  ].join("");
  els.youtubeCamera.value = cameraOptions.some((device) => device.deviceId === currentCamera) ? currentCamera : "";
  els.youtubeMicrophone.value = micOptions.some((device) => device.deviceId === currentMic) ? currentMic : "";
}

function handleYouTubeFormChange(event) {
  saveYouTubeSettings({ silent: true, debounce: true });
  if (event.target === els.youtubeCamera) {
    window.setTimeout(() => startYouTubePreview(), 100);
  }
}

function collectYouTubeSettingsFromForm() {
  const cameraOption = els.youtubeCamera?.selectedOptions?.[0];
  const micOption = els.youtubeMicrophone?.selectedOptions?.[0];
  return {
    enabled: Boolean(els.youtubeEnabled?.checked),
    clientId: els.youtubeClientId?.value || "",
    clientSecret: els.youtubeClientSecret?.value || "",
    privacyStatus: els.youtubePrivacy?.value || "unlisted",
    titleTemplate: els.youtubeTitle?.value || "{event} - Livestream",
    ffmpegPath: els.youtubeFfmpegPath?.value || "",
    cameraDeviceId: els.youtubeCamera?.value || "",
    cameraLabel: cameraOption && cameraOption.value ? cameraOption.textContent : "",
    microphoneDeviceId: els.youtubeMicrophone?.value || "",
    microphoneLabel: micOption && micOption.value ? micOption.textContent : "",
  };
}

async function saveYouTubeSettings(options = {}) {
  if (options.debounce) {
    window.clearTimeout(youtubeSaveTimer);
    youtubeSaveTimer = window.setTimeout(() => saveYouTubeSettings({ silent: true }), 350);
    return;
  }
  if (!serverMode) {
    if (!options.silent) showToast("YouTube Live ist nur in der installierten Server-App verfuegbar.");
    return;
  }
  try {
    const response = await fetch("/api/youtube/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectYouTubeSettingsFromForm()),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "YouTube-Einstellungen konnten nicht gespeichert werden.");
    if (!sessionInfo) sessionInfo = {};
    sessionInfo.youtube = payload.youtube || sessionInfo.youtube;
    renderYouTubeStatusOnly();
    renderHeader();
    if (!options.silent) showToast("YouTube-Einstellungen gespeichert.");
  } catch (error) {
    if (!options.silent) showToast(error.message || "YouTube-Einstellungen konnten nicht gespeichert werden.");
  }
}

async function connectYouTubeAccount() {
  if (!serverMode) {
    showToast("YouTube-Verbindung ist nur in der installierten Server-App verfuegbar.");
    return;
  }
  const authWindow = window.open("", "gewichtheben-youtube-auth", "width=820,height=760");
  try {
    await saveYouTubeSettings({ silent: true });
    const response = await fetch("/api/youtube/auth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectYouTubeSettingsFromForm()),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "YouTube-Anmeldung konnte nicht gestartet werden.");
    if (authWindow) authWindow.location.href = payload.authUrl;
    else window.open(payload.authUrl, "gewichtheben-youtube-auth", "width=820,height=760");
    showToast("Google-Anmeldung geoeffnet. Nach der Freigabe ist YouTube verbunden.");
    window.setTimeout(loadSessionInfoAndRenderYouTube, 2500);
  } catch (error) {
    if (authWindow) authWindow.close();
    showToast(error.message || "YouTube-Anmeldung konnte nicht gestartet werden.");
  }
}

async function installYouTubeFfmpeg() {
  if (!serverMode) {
    showToast("FFmpeg kann nur in der installierten Server-App eingerichtet werden.");
    return;
  }
  try {
    showToast("FFmpeg wird eingerichtet. Das kann einen Moment dauern.");
    await saveYouTubeSettings({ silent: true });
    const response = await fetch("/api/youtube/ffmpeg/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "FFmpeg konnte nicht eingerichtet werden.");
    if (!sessionInfo) sessionInfo = {};
    sessionInfo.youtube = payload.youtube || sessionInfo.youtube;
    renderYouTubeSettings();
    showToast(payload.alreadyInstalled ? "FFmpeg ist bereits eingerichtet." : "FFmpeg wurde eingerichtet.");
  } catch (error) {
    showToast(error.message || "FFmpeg konnte nicht eingerichtet werden.");
    await loadSessionInfoAndRenderYouTube();
  }
}

async function loadSessionInfoAndRenderYouTube() {
  await loadSessionInfo();
  renderYouTubeSettings();
  renderHeader();
}

async function refreshYouTubeDevices(options = {}) {
  if (!navigator.mediaDevices?.enumerateDevices) {
    showToast("Dieser Browser kann Kamera und Mikrofon nicht auslesen.");
    return;
  }
  try {
    if (options.requestPermission && !youtubeDevicePermissionRequested) {
      const streams = await Promise.allSettled([
        navigator.mediaDevices.getUserMedia({ video: true }),
        navigator.mediaDevices.getUserMedia({ audio: true }),
      ]);
      streams.forEach((result) => {
        if (result.status === "fulfilled") result.value.getTracks().forEach((track) => track.stop());
      });
      youtubeDevicePermissionRequested = true;
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    youtubeDevices = {
      cameras: devices.filter((device) => device.kind === "videoinput"),
      microphones: devices.filter((device) => device.kind === "audioinput"),
    };
    renderYouTubeDeviceSelects(youtubePayload().settings || {});
    if (options.requestPermission) {
      showToast("Kameras und Mikrofone aktualisiert.");
      window.setTimeout(() => startYouTubePreview({ silent: true }), 100);
    }
  } catch (error) {
    showToast("Kamera/Mikrofon konnte nicht gelesen werden. Bitte Browser-Berechtigung erlauben.");
  }
}

function youtubeMediaConstraints(settings = collectYouTubeSettingsFromForm(), options = {}) {
  const video = settings.cameraDeviceId ? { deviceId: { exact: settings.cameraDeviceId } } : true;
  const audio = options.videoOnly ? false : settings.microphoneDeviceId ? { deviceId: { exact: settings.microphoneDeviceId } } : true;
  return { video, audio };
}

function scheduleYouTubePreviewStart() {
  if (activeSetupView !== "youtube") return;
  if (!els.youtubePreview || youtubePreviewStream || youtubeMediaStream) return;
  window.clearTimeout(youtubePreviewStartTimer);
  youtubePreviewStartTimer = window.setTimeout(() => startYouTubePreview({ silent: true }), 250);
}

function setYouTubePreviewState(active, message = "Kamera-Vorschau startet nach Auswahl der Kamera.") {
  if (els.youtubePreviewEmpty) {
    els.youtubePreviewEmpty.textContent = message;
    els.youtubePreviewEmpty.classList.toggle("hidden", Boolean(active));
  }
}

async function startYouTubePreview(options = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    if (!options.silent) showToast("Dieser Browser unterstuetzt keine Live-Vorschau.");
    setYouTubePreviewState(false, "Dieser Browser unterstuetzt keine Live-Vorschau.");
    return;
  }
  stopYouTubePreview();
  try {
    youtubePreviewStream = await navigator.mediaDevices.getUserMedia(youtubeMediaConstraints(undefined, { videoOnly: true }));
    youtubeDevicePermissionRequested = true;
    if (els.youtubePreview) {
      els.youtubePreview.srcObject = youtubePreviewStream;
      await els.youtubePreview.play?.().catch(() => {});
    }
    setYouTubePreviewState(true);
    await refreshYouTubeDevices({ requestPermission: false });
  } catch (error) {
    setYouTubePreviewState(false, "Kamera-Vorschau konnte nicht gestartet werden. Bitte Browser-Berechtigung pruefen.");
    if (!options.silent) showToast("Kamera-Vorschau konnte nicht gestartet werden.");
  }
}

function stopYouTubePreview() {
  if (youtubePreviewStream) {
    youtubePreviewStream.getTracks().forEach((track) => track.stop());
    youtubePreviewStream = null;
  }
  if (els.youtubePreview && els.youtubePreview.srcObject !== youtubeMediaStream) {
    els.youtubePreview.srcObject = null;
    setYouTubePreviewState(false);
  }
}

async function startYouTubeLiveIfConfigured() {
  if (!serverMode) return;
  const storedSettings = youtubePayload().settings || {};
  if (!storedSettings.enabled) return;
  try {
    if (activeSetupView === "youtube") await saveYouTubeSettings({ silent: true });
    const response = await fetch("/api/youtube/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: state.meta.eventName,
        category: state.meta.category,
        platform: state.meta.group,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Livestream konnte nicht gestartet werden.");
    if (!sessionInfo) sessionInfo = {};
    sessionInfo.youtube = payload.youtube || sessionInfo.youtube;
    renderHeader();
    renderYouTubeStatusOnly();
    if (!payload.skipped) await startYouTubeMediaCapture(youtubePayload().settings || storedSettings);
    showToast(payload.skipped ? "YouTube-Livestream ist deaktiviert." : "YouTube-Livestream wird gestartet.");
  } catch (error) {
    showToast(error.message || "YouTube-Livestream konnte nicht gestartet werden.");
    await loadSessionInfoAndRenderYouTube();
  }
}

async function startYouTubeMediaCapture(settings = {}) {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    showToast("Dieser Browser kann den Livestream nicht aufnehmen.");
    return;
  }
  stopYouTubePreview();
  stopYouTubeMediaCapture();
  let sourceStream = null;
  try {
    sourceStream = await navigator.mediaDevices.getUserMedia(youtubeMediaConstraints(settings));
  } catch (error) {
    sourceStream = await navigator.mediaDevices.getUserMedia(youtubeMediaConstraints(settings, { videoOnly: true }));
    showToast("Mikrofon konnte nicht gestartet werden. Livestream laeuft ohne Ton.");
  }
  youtubeSourceMediaStream = sourceStream;
  youtubeMediaStream = await createYouTubeOverlayMediaStream(sourceStream);
  setVideoElementStream(els.youtubePreview, youtubeMediaStream);
  renderTopCameraPreview();
  const mimeType = youtubeRecorderMimeType();
  youtubeRecorder = new MediaRecorder(youtubeMediaStream, mimeType ? { mimeType } : undefined);
  youtubeUploadChain = Promise.resolve();
  youtubeRecorder.ondataavailable = (event) => {
    if (!event.data || event.data.size === 0) return;
    youtubeUploadChain = youtubeUploadChain
      .then(() => postYouTubeMediaChunk(event.data))
      .catch((error) => {
        console.warn(error);
      });
  };
  youtubeRecorder.onerror = () => showToast("Livestream-Aufnahme meldet einen Fehler.");
  youtubeRecorder.start(1000);
}

async function createYouTubeOverlayMediaStream(sourceStream) {
  const videoTrack = sourceStream?.getVideoTracks?.()[0];
  if (!videoTrack || !document.createElement("canvas").captureStream) return sourceStream;

  try {
    youtubeOverlayVideo = document.createElement("video");
    youtubeOverlayVideo.muted = true;
    youtubeOverlayVideo.playsInline = true;
    youtubeOverlayVideo.srcObject = sourceStream;
    await youtubeOverlayVideo.play();
    await waitForYouTubeVideoFrame(youtubeOverlayVideo);

    const trackSettings = videoTrack.getSettings?.() || {};
    const width = Math.max(320, Math.round(Number(trackSettings.width) || youtubeOverlayVideo.videoWidth || 1280));
    const height = Math.max(180, Math.round(Number(trackSettings.height) || youtubeOverlayVideo.videoHeight || 720));
    const frameRate = Math.min(30, Math.max(10, Math.round(Number(trackSettings.frameRate) || 30)));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return sourceStream;

    const drawFrame = () => {
      drawYouTubeVideoFrame(context, youtubeOverlayVideo, width, height);
      youtubeOverlayFrameRequest = window.requestAnimationFrame(drawFrame);
    };
    drawFrame();

    youtubeOverlayCanvasStream = canvas.captureStream(frameRate);
    const output = new MediaStream();
    youtubeOverlayCanvasStream.getVideoTracks().forEach((track) => output.addTrack(track));
    sourceStream.getAudioTracks().forEach((track) => output.addTrack(track));
    return output;
  } catch (error) {
    console.warn(error);
    stopYouTubeOverlayRenderer();
    showToast("Livestream laeuft ohne eingeblendetes Infofeld.");
    return sourceStream;
  }
}

function waitForYouTubeVideoFrame(video) {
  if (video.readyState >= 2 && video.videoWidth && video.videoHeight) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("loadedmetadata", finish);
      video.removeEventListener("canplay", finish);
      window.clearTimeout(timeout);
      resolve();
    };
    const timeout = window.setTimeout(finish, 1500);
    video.addEventListener("loadedmetadata", finish, { once: true });
    video.addEventListener("canplay", finish, { once: true });
  });
}

function drawYouTubeVideoFrame(context, video, width, height) {
  context.fillStyle = "#050b12";
  context.fillRect(0, 0, width, height);
  if (video?.readyState >= 2) {
    context.drawImage(video, 0, 0, width, height);
  }
  drawYouTubeStreamOverlay(context, width, height, getYouTubeStreamOverlayData());
}

function getYouTubeStreamOverlayData() {
  if (state.meta.mode === "groupComplete" || state.meta.breakPending) return getYouTubePauseOverlayData();
  if (state.meta.mode === "finished") {
    return {
      type: "pause",
      eyebrow: "Wettkampf",
      title: "Beendet",
      subtitle: "Ergebnisse werden erstellt.",
    };
  }
  if (state.meta.mode !== "competition") return null;

  const current = getCurrentAttempt();
  if (!current) {
    return {
      type: "pause",
      eyebrow: "Wettkampf",
      title: "Pause",
      subtitle: "Keine offenen Versuche.",
    };
  }

  const key = attemptKey(current);
  const liveVotes = state.meta.liveVotes?.key === key ? state.meta.liveVotes.votes || [] : [];
  const activeVotes = getRefereeSlots().map((slot) => (slot.voteIndex in liveVotes ? liveVotes[slot.voteIndex] : null));
  const whiteVotes = activeVotes.filter(Boolean).length;
  const redVotes = activeVotes.filter((vote) => vote === false).length;
  const openVotes = activeVotes.filter((vote) => vote === null).length;
  const decision =
    openVotes > 0
      ? `${whiteVotes} wei\u00df \u00b7 ${redVotes} rot \u00b7 ${openVotes} offen`
      : whiteVotes >= getRequiredGoodVotes()
        ? `${whiteVotes} wei\u00df \u00b7 ${redVotes} rot \u00b7 g\u00fcltig`
        : `${whiteVotes} wei\u00df \u00b7 ${redVotes} rot \u00b7 ung\u00fcltig`;

  return {
    type: "attempt",
    eyebrow: "Aktueller Versuch",
    athlete: current.athlete.name || "-",
    detail: `${youtubeLiftLabel(current.lift)} \u00b7 Versuch ${current.attemptNo} \u00b7 Gruppe ${groupNameById(current.athlete.groupId)}`,
    weight: `${formatScore(current.weight)} kg`,
    result: `KR: ${decision}`,
  };
}

function getYouTubePauseOverlayData() {
  const activeGroup = getActiveGroup();
  const nextGroupId = firstPendingGroupId();
  const nextGroupName = nextGroupId ? groupNameById(nextGroupId) : "";
  let subtitle = "Jetzt wird pausiert.";
  if (state.meta.breakPending || state.meta.activeLift === "snatch") {
    subtitle = activeGroup ? `Gruppe ${activeGroup.name}: Pause vor dem Sto\u00dfen.` : "Pause vor dem Sto\u00dfen.";
  } else if (nextGroupName) {
    subtitle = `N\u00e4chste Gruppe: ${nextGroupName}.`;
  }
  return {
    type: "pause",
    eyebrow: "Pause",
    title: "Jetzt Pause",
    subtitle,
  };
}

function youtubeLiftLabel(lift) {
  return lift === "cleanJerk" ? "Sto\u00dfen" : "Rei\u00dfen";
}

function drawYouTubeStreamOverlay(context, width, height, data) {
  if (!data) return;

  const margin = Math.max(14, Math.round(width * 0.024));
  const boxWidth = Math.min(Math.max(Math.round(width * 0.28), 260), 430);
  const boxHeight = data.type === "attempt" ? Math.max(112, Math.round(height * 0.17)) : Math.max(82, Math.round(height * 0.12));
  const x = width - boxWidth - margin;
  const y = height - boxHeight - margin;
  const padding = Math.max(12, Math.round(boxWidth * 0.045));

  context.save();
  drawCanvasRoundRect(context, x, y, boxWidth, boxHeight, 14);
  context.fillStyle = "rgba(4, 16, 27, 0.76)";
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.32)";
  context.lineWidth = Math.max(1, Math.round(width / 1400));
  context.stroke();

  let textY = y + padding + 12;
  context.textBaseline = "alphabetic";
  context.fillStyle = "#83f3ff";
  context.font = `800 ${Math.max(10, Math.round(boxWidth * 0.037))}px Arial, sans-serif`;
  context.fillText(String(data.eyebrow || "").toUpperCase(), x + padding, textY);

  if (data.type === "attempt") {
    textY += Math.round(boxHeight * 0.27);
    context.fillStyle = "#ffffff";
    context.font = `900 ${Math.max(22, Math.round(boxWidth * 0.085))}px Arial, sans-serif`;
    drawTruncatedCanvasText(context, data.athlete, x + padding, textY, boxWidth - padding * 2);

    textY += Math.round(boxHeight * 0.24);
    context.fillStyle = "#dce6ef";
    context.font = `800 ${Math.max(13, Math.round(boxWidth * 0.045))}px Arial, sans-serif`;
    drawTruncatedCanvasText(context, data.detail, x + padding, textY, boxWidth - padding * 2);

    const weightY = y + boxHeight - padding - 10;
    context.fillStyle = "#ffffff";
    context.font = `900 ${Math.max(22, Math.round(boxWidth * 0.09))}px Arial, sans-serif`;
    context.fillText(data.weight, x + padding, weightY);

    context.fillStyle = "#c6d2dc";
    context.font = `800 ${Math.max(10, Math.round(boxWidth * 0.034))}px Arial, sans-serif`;
    context.textAlign = "right";
    drawTruncatedCanvasText(context, data.result, x + boxWidth - padding, weightY, Math.round(boxWidth * 0.48), "right");
  } else {
    textY += Math.round(boxHeight * 0.38);
    context.fillStyle = "#ffffff";
    context.font = `900 ${Math.max(22, Math.round(boxWidth * 0.08))}px Arial, sans-serif`;
    drawTruncatedCanvasText(context, data.title, x + padding, textY, boxWidth - padding * 2);

    textY += Math.round(boxHeight * 0.24);
    context.fillStyle = "#dce6ef";
    context.font = `800 ${Math.max(12, Math.round(boxWidth * 0.04))}px Arial, sans-serif`;
    drawTruncatedCanvasText(context, data.subtitle, x + padding, textY, boxWidth - padding * 2);
  }
  context.restore();
}

function drawCanvasRoundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawTruncatedCanvasText(context, text, x, y, maxWidth, align = "left") {
  const value = truncateCanvasText(context, String(text || ""), maxWidth);
  const previousAlign = context.textAlign;
  context.textAlign = align;
  context.fillText(value, x, y);
  context.textAlign = previousAlign;
}

function truncateCanvasText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text;
  let output = text;
  while (output.length > 3 && context.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output.trim()}...`;
}

function stopYouTubeOverlayRenderer() {
  if (youtubeOverlayFrameRequest) {
    window.cancelAnimationFrame(youtubeOverlayFrameRequest);
    youtubeOverlayFrameRequest = null;
  }
  if (youtubeOverlayVideo) {
    youtubeOverlayVideo.pause?.();
    youtubeOverlayVideo.srcObject = null;
    youtubeOverlayVideo = null;
  }
  if (youtubeOverlayCanvasStream) {
    youtubeOverlayCanvasStream.getTracks().forEach((track) => track.stop());
    youtubeOverlayCanvasStream = null;
  }
}

function youtubeRecorderMimeType() {
  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

async function postYouTubeMediaChunk(blob) {
  const response = await fetch("/api/youtube/media-chunk", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: blob,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Livestream-Daten konnten nicht gesendet werden.");
  }
}

function stopYouTubeMediaCapture() {
  if (youtubeRecorder && youtubeRecorder.state !== "inactive") {
    try {
      youtubeRecorder.stop();
    } catch (error) {
      // best effort
    }
  }
  youtubeRecorder = null;
  stopYouTubeOverlayRenderer();
  const tracks = new Set();
  [youtubeMediaStream, youtubeSourceMediaStream].forEach((stream) => {
    stream?.getTracks?.().forEach((track) => tracks.add(track));
  });
  tracks.forEach((track) => track.stop());
  youtubeMediaStream = null;
  youtubeSourceMediaStream = null;
  if (els.youtubePreview) els.youtubePreview.srcObject = null;
  renderTopCameraPreview();
  setYouTubePreviewState(false);
}

async function endYouTubeLiveStream() {
  if (!serverMode) return;
  try {
    stopYouTubeMediaCapture();
    await youtubeUploadChain.catch(() => {});
    const response = await fetch("/api/youtube/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Livestream konnte nicht beendet werden.");
    if (!sessionInfo) sessionInfo = {};
    sessionInfo.youtube = payload.youtube || sessionInfo.youtube;
    renderHeader();
    renderYouTubeStatusOnly();
    showToast("Livestream wurde beendet und bleibt bei YouTube als Video erhalten.");
  } catch (error) {
    showToast(error.message || "Livestream konnte nicht beendet werden.");
    await loadSessionInfoAndRenderYouTube();
  }
}

function renderGroupSelect() {
  const selected = els.athleteGroup.value || state.athletes.find((athlete) => athlete.id === editingAthleteId)?.groupId;
  const groups = getOrderedGroups();
  els.athleteGroup.innerHTML = groups
    .map((group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`)
    .join("");
  els.athleteGroup.value = selected && groups.some((group) => group.id === selected) ? selected : groups[0]?.id || "";
}

function renderTeamSelect() {
  if (!els.athleteTeamId) return;
  const selected = els.athleteTeamId.value || state.athletes.find((athlete) => athlete.id === editingAthleteId)?.teamId || "";
  const teams = getTeams();
  els.athleteTeamId.innerHTML = [
    `<option value="">Keine Mannschaft</option>`,
    ...teams.map((team) => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`),
  ].join("");
  els.athleteTeamId.value = selected && teams.some((team) => team.id === selected) ? selected : "";
}

function renderCategorySelect() {
  if (!els.athleteGender) return;
  const selected = els.athleteGender.value || state.athletes.find((athlete) => athlete.id === editingAthleteId)?.gender;
  const categories = getCategories();
  els.athleteGender.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`)
    .join("");
  els.athleteGender.value =
    selected && categories.some((category) => category.id === selected) ? selected : defaultCategoryId();
}

function renderAgeClassSelect() {
  if (!els.athleteAgeClass) return;
  const selected = els.athleteAgeClass.value || state.athletes.find((athlete) => athlete.id === editingAthleteId)?.ageClass || "senior";
  els.athleteAgeClass.innerHTML = AGE_CLASSES.map(
    (ageClass) => `<option value="${ageClass.key}">${escapeHtml(ageClass.label)}</option>`,
  ).join("");
  els.athleteAgeClass.value = AGE_CLASSES.some((ageClass) => ageClass.key === selected) ? selected : "senior";
}

function renderWeightClassSelect() {
  if (!els.athleteWeightClass) return;
  const previous =
    els.athleteWeightClass.value ||
    state.athletes.find((athlete) => athlete.id === editingAthleteId)?.weightClass ||
    "";
  const options = getWeightClassOptions(els.athleteGender.value, els.athleteAgeClass.value);
  els.athleteWeightClass.innerHTML = options
    .map((weightClass) => `<option value="${escapeHtml(weightClass)}">${escapeHtml(formatWeightClass(weightClass))}</option>`)
    .join("");
  els.athleteWeightClass.value = options.includes(previous) ? previous : options[0] || "";
}

function renderGroups() {
  const groups = getOrderedGroups();
  if (!groups.length) {
    els.groupsList.innerHTML = `<p class="muted">Noch keine Gruppe angelegt.</p>`;
    return;
  }

  els.groupsList.innerHTML = groups
    .map((group, index) => {
      const athletes = athletesForGroup(group.id);
      const canDelete = groups.length > 1 && athletes.length === 0;
      return `
        <div class="group-chip">
          <label>
            <span>Gruppenname</span>
            <input class="compact-input" type="text" value="${escapeHtml(group.name)}" data-group-field="name" data-id="${group.id}" />
          </label>
          <span class="muted">${index + 1}. Durchgang · ${athletes.length} Athlet${athletes.length === 1 ? "" : "en"}</span>
          <div class="row-actions group-actions">
            <button type="button" class="mini-button" data-action="move-group" data-direction="up" data-id="${group.id}" ${index === 0 ? "disabled" : ""}>Hoch</button>
            <button type="button" class="mini-button" data-action="move-group" data-direction="down" data-id="${group.id}" ${index === groups.length - 1 ? "disabled" : ""}>Runter</button>
            ${
              canDelete
                ? `<button type="button" class="mini-button" data-action="delete-group" data-id="${group.id}">Entfernen</button>`
                : `<span class="muted">${athletes.length ? "zugeordnet" : "letzte Gruppe"}</span>`
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTeams() {
  if (!els.teamsList) return;
  const teams = getTeams();
  if (!teams.length) {
    els.teamsList.innerHTML = `<p class="muted">Noch keine Mannschaft angelegt.</p>`;
    return;
  }

  const teamScores = new Map((isIwfMode() ? calculateIwfTeamPoints() : getTeamStandings()).map((row) => [row.team.id, row]));
  els.teamsList.innerHTML = teams
    .map((team) => {
      const athletes = athletesForTeam(team.id);
      const row = teamScores.get(team.id);
      const canDelete = athletes.length === 0;
      return `
        <div class="group-chip team-chip">
          <label>
            <span>Mannschaftsname</span>
            <input class="compact-input" type="text" value="${escapeHtml(team.name)}" data-team-field="name" data-id="${team.id}" />
          </label>
          <label>
            <span>Wertungspl&auml;tze</span>
            <input class="compact-input small-number" type="number" min="1" max="10" step="1" value="${teamMaxScorers(team)}" data-team-field="maxScorers" data-id="${team.id}" />
          </label>
          <span class="muted">${athletes.length} Athlet${athletes.length === 1 ? "" : "en"} zugeordnet</span>
          <strong>${row ? (isIwfMode() ? row.totalTeamPoints : formatScore(row.score)) : "0"} ${isIwfMode() ? "IWF-Punkte" : "Relativpunkte"}</strong>
          <div class="row-actions group-actions">
            ${
              canDelete
                ? `<button type="button" class="mini-button" data-action="delete-team" data-id="${team.id}">Entfernen</button>`
                : `<span class="muted">zugeordnet</span>`
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCompetition() {
  const inCompetition = state.meta.mode !== "setup";
  els.competitionPanel.classList.toggle("hidden", !inCompetition);
  if (!inCompetition) return;

  const lift = state.meta.activeLift;
  const activeGroup = getActiveGroup();
  const groupLabel = activeGroup ? `Gruppe ${activeGroup.name}` : "Gruppe";
  els.phaseEyebrow.textContent =
    state.meta.mode === "finished"
      ? "Abschluss"
      : state.meta.mode === "snatchComplete"
        ? "Reißen abgeschlossen"
      : state.meta.mode === "groupComplete"
        ? "Gruppe abgeschlossen"
        : `Wettkampf · ${groupLabel}`;
  els.phaseTitle.textContent =
    state.meta.mode === "finished"
      ? "Endergebnis"
      : state.meta.mode === "snatchComplete"
        ? "Reißen aller Gruppen abgeschlossen"
      : state.meta.mode === "groupComplete"
        ? `${groupLabel} abgeschlossen`
      : state.meta.breakPending
        ? `${groupLabel}: Pause vor dem Stoßen`
        : `${LIFTS[lift].label} · ${groupLabel}`;
  els.snatchTab.classList.toggle("active", lift === "snatch" && state.meta.mode === "competition");
  els.cleanTab.classList.toggle("active", lift === "cleanJerk" && state.meta.mode === "competition");

  renderCurrentAttempt();
  renderQueue();
  renderTeamStandings();
  renderStandings();
  renderProtocol();
}

function renderConnection() {
  if (!els.connectionPanel) return;
  els.connectionPanel.classList.toggle("hidden", !serverMode);
  if (!serverMode) return;

  const judges = sessionInfo?.judges || state.meta.judgeConnections || {};
  const judgeUrls = sessionInfo?.urls?.length ? sessionInfo.urls : [sessionInfo?.judgeUrl].filter(Boolean);
  const weighUrls = sessionInfo?.weighUrls?.length
    ? sessionInfo.weighUrls
    : judgeUrls.map((url) => url.replace(/\/judge$/, "/waage"));
  const tabletUrls = sessionInfo?.tabletUrls?.length
    ? sessionInfo.tabletUrls
    : judgeUrls.map((url) => url.replace(/\/judge$/, "/warteraum"));
  const waitingRoomDisplayUrls = sessionInfo?.waitingRoomDisplayUrls?.length
    ? sessionInfo.waitingRoomDisplayUrls
    : judgeUrls.map((url) => url.replace(/\/judge$/, "/pi"));
  const displayStationUrls = sessionInfo?.displayStationUrls?.length
    ? sessionInfo.displayStationUrls
    : judgeUrls.map((url) => url.replace(/\/judge$/, "/display"));
  const pcJudgeUrl = judgeUrls.find((url) => url.includes("localhost")) || "http://localhost:8765/judge";
  const phoneUrls = judgeUrls.filter((url) => !url.includes("localhost"));
  const wlanWeighUrls = weighUrls.filter((url) => !url.includes("localhost"));
  const wlanTabletUrls = tabletUrls.filter((url) => !url.includes("localhost"));
  const wlanWaitingRoomDisplayUrls = waitingRoomDisplayUrls.filter((url) => !url.includes("localhost"));
  const wlanDisplayStationUrls = displayStationUrls.filter((url) => !url.includes("localhost"));
  const displayClients = Array.isArray(sessionInfo?.displayClients) ? sessionInfo.displayClients : [];
  const code = sessionInfo?.code || "----";
  const qrUrl = phoneUrls[0] || pcJudgeUrl;
  const slots = getRefereeSlots();

  els.connectionPanel.innerHTML = `
    <div class="connection-list">
      <p class="eyebrow">Handys verbinden</p>
      <h3>QR-Code scannen</h3>
      <span class="connection-code">${escapeHtml(code)}</span>
      ${
        qrUrl
          ? `<img class="qr-code" src="/api/qr.svg?data=${encodeURIComponent(qrUrl)}" alt="QR-Code für Kampfrichter-App" />
             <p class="muted">QR-Code öffnet die Kampfrichter-App. Code am Handy manuell eingeben.</p>`
          : `<span class="connection-code">${escapeHtml(code)}</span>`
      }
      <button type="button" class="ghost-button" data-action="rotate-code">Neuen Code erzeugen</button>
    </div>
    <div class="connection-list">
      <h3>Kampfrichter-App</h3>
      <p class="muted">PC-Testadresse</p>
      <p class="connection-url">${escapeHtml(pcJudgeUrl)}</p>
      <p class="muted">Handy im gleichen WLAN</p>
      ${
        phoneUrls.length
          ? phoneUrls.map((url) => `<p class="connection-url">${escapeHtml(url)}</p>`).join("")
          : `<p class="warning-text">Keine WLAN-Adresse gefunden.</p>`
      }
      <p class="muted">Waage im gleichen WLAN</p>
      ${
        wlanWeighUrls.length
          ? wlanWeighUrls.map((url) => `<p class="connection-url">${escapeHtml(url)}</p>`).join("")
          : `<p class="warning-text">Keine Waage-WLAN-Adresse gefunden.</p>`
      }
      <p class="muted">Warteraum-Eingabe im gleichen WLAN</p>
      ${
        wlanTabletUrls.length
          ? wlanTabletUrls.map((url) => `<p class="connection-url">${escapeHtml(url)}</p>`).join("")
          : `<p class="warning-text">Keine Warteraum-WLAN-Adresse gefunden.</p>`
      }
      <p class="muted">Bildschirmstation fuer Pi / Beamer</p>
      ${
        wlanDisplayStationUrls.length
          ? wlanDisplayStationUrls.map((url) => `<p class="connection-url">${escapeHtml(url)}</p>`).join("")
          : `<p class="warning-text">Keine Bildschirmstation-Adresse gefunden.</p>`
      }
      <button type="button" class="ghost-button" data-action="open-display-routing">Bildschirme zuweisen (${displayClients.length})</button>
      <button type="button" class="ghost-button" data-action="open-window-screen-settings">PC-Fenster zuordnen</button>
      <p class="muted">Direktlink Warteraum-Anzeige</p>
      ${
        wlanWaitingRoomDisplayUrls.length
          ? wlanWaitingRoomDisplayUrls.map((url) => `<p class="connection-url">${escapeHtml(url)}</p>`).join("")
          : `<p class="warning-text">Keine Pi-Anzeige-Adresse gefunden.</p>`
      }
      <p class="muted">Der Direktlink zeigt nur die Warteraum-Anzeige und benoetigt keinen Login-Code.</p>
      ${renderControlClientStatus()}
      <p class="muted">Wenn das Handy die Seite nicht lädt: Windows-Firewall für node.exe in privaten Netzwerken erlauben und kein Gast-WLAN verwenden.</p>
      <div class="judge-slots">
        ${slots
          .map((slot) => {
            const judge = judges[slot.key];
            return `
              <div class="judge-slot">
                <strong>${slot.label}</strong>
                <span class="${judge ? "ok-text" : "muted"}">${judge ? escapeHtml(judge.name) : "nicht verbunden"}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderControlClientStatus() {
  const clients = Array.isArray(sessionInfo?.controlClients) ? sessionInfo.controlClients : [];
  const weighClients = Array.isArray(sessionInfo?.weighClients) ? sessionInfo.weighClients : [];
  const waitingRoomClients = Array.isArray(sessionInfo?.tabletClients) ? sessionInfo.tabletClients : [];
  const own = clients.find(isOwnControlClient) || (isHostView() ? clients.find(isHostClient) : null);
  const ownIdentity = own ? controlClientIdentity(own) : isHostView() ? "host" : null;
  const weighRows = weighClients.length
    ? weighClients
        .map((client, index) => {
          const label = index === 0 ? "Waage" : `Waage ${index + 1}`;
          return `
            <div class="judge-slot">
              <strong>${label}</strong>
              <span class="ok-text">verbunden</span>
            </div>
          `;
        })
        .join("")
    : `
      <div class="judge-slot">
        <strong>Waage</strong>
        <span class="muted">nicht verbunden</span>
      </div>
    `;
  const waitingRoomRows = waitingRoomClients.length
    ? waitingRoomClients
        .map(
          (client, index) => `
            <div class="judge-slot">
              <strong>${index === 0 ? "Warteraum" : `Warteraum ${index + 1}`}</strong>
              <span class="ok-text">verbunden</span>
            </div>
          `,
        )
        .join("")
    : `
      <div class="judge-slot">
        <strong>Warteraum</strong>
        <span class="muted">nicht verbunden</span>
      </div>
    `;

  return `
    <div class="judge-slots pc-slots">
      <div class="judge-slot">
        <strong>Dieser PC</strong>
        <span class="${own ? "ok-text" : "muted"}">${own ? "verbunden" : "verbinde..."}</span>
      </div>
      ${weighRows}
      ${waitingRoomRows}
    </div>
  `;
}

function openDisplayRoutingDialog() {
  if (!serverMode) {
    showToast("Bildschirmzuordnung ist nur im Serverbetrieb moeglich.");
    return;
  }
  renderDisplayRoutingDialog();
  els.displayRoutingDialog.showModal();
}

function closeDisplayRoutingDialog() {
  els.displayRoutingDialog.close();
}

function renderDisplayRoutingDialog() {
  if (!els.displayRoutingList) return;
  const displayUrls = sessionInfo?.displayStationUrls?.length
    ? sessionInfo.displayStationUrls.filter((url) => !url.includes("localhost"))
    : [];
  const clients = Array.isArray(sessionInfo?.displayClients) ? sessionInfo.displayClients : [];

  if (!clients.length) {
    els.displayRoutingList.innerHTML = `
      <div class="empty-display-routing">
        <p class="muted">Noch keine Bildschirmstation verbunden.</p>
        ${
          displayUrls.length
            ? `<p class="connection-url">${escapeHtml(displayUrls[0])}</p>`
            : `<p class="warning-text">Keine Netzwerkadresse gefunden.</p>`
        }
      </div>
    `;
    return;
  }

  els.displayRoutingList.innerHTML = clients
    .map((client) => {
      const assignment = client.assignment || sessionInfo?.displayAssignments?.[client.id] || "";
      return `
        <div class="display-routing-row">
          <div class="display-device">
            <strong>${escapeHtml(client.name || "Bildschirm")}</strong>
            <span class="muted">${escapeHtml(client.address || "Netzwerk")} · verbunden</span>
          </div>
          <label>
            <span>Ansicht</span>
            <select data-display-assignment data-id="${escapeHtml(client.id)}">
              ${renderDisplayRoleOptions(assignment)}
            </select>
          </label>
        </div>
      `;
    })
    .join("");
}

function renderDisplayRoleOptions(selectedRole) {
  return DISPLAY_ROLES.map(
    (role) => `<option value="${escapeHtml(role.key)}" ${role.key === selectedRole ? "selected" : ""}>${escapeHtml(role.label)}</option>`,
  ).join("");
}

async function assignDisplayRole(id, role) {
  if (!serverMode || !id) return;
  try {
    const response = await fetch("/api/display/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.error || "Bildschirm konnte nicht zugewiesen werden.");
      return;
    }
    if (result.session) sessionInfo = result.session;
    renderConnection();
    renderDisplayRoutingDialog();
    showToast("Bildschirmzuordnung gespeichert.");
  } catch (error) {
    showToast("Bildschirmzuordnung konnte nicht gespeichert werden.");
  }
}

async function openWindowScreenDialog() {
  await refreshLocalScreens({ notify: false });
  renderWindowScreenDialog();
  if (typeof els.windowScreenDialog.showModal === "function") {
    els.windowScreenDialog.showModal();
  } else {
    els.windowScreenDialog.setAttribute("open", "");
  }
}

function closeWindowScreenDialog() {
  if (els.windowScreenDialog?.open) els.windowScreenDialog.close();
}

async function refreshLocalScreens(options = {}) {
  localScreens = await detectLocalScreens();
  renderWindowScreenDialog();
  if (options.notify) {
    showToast(localScreens.length > 1 ? `${localScreens.length} Bildschirme erkannt.` : "Ein Bildschirm erkannt.");
  }
}

async function detectLocalScreens() {
  localScreenDetectionMessage = "";
  if ("getScreenDetails" in window) {
    try {
      const details = await window.getScreenDetails();
      const screens = Array.from(details.screens || []).map(normalizeLocalScreen);
      if (screens.length) return screens;
    } catch (error) {
      localScreenDetectionMessage = "Chrome hat die Bildschirmfreigabe nicht erteilt. Bitte die Abfrage erlauben.";
    }
  } else {
    localScreenDetectionMessage = "Dieser Browser kann angeschlossene Bildschirme nicht automatisch auflisten.";
  }
  return [fallbackLocalScreen()];
}

function normalizeLocalScreen(screen, index) {
  const left = Math.round(Number(screen.availLeft ?? screen.left ?? 0));
  const top = Math.round(Number(screen.availTop ?? screen.top ?? 0));
  const width = Math.round(Number(screen.availWidth ?? screen.width ?? 1280));
  const height = Math.round(Number(screen.availHeight ?? screen.height ?? 720));
  const id = localScreenId({ left, top, width, height });
  const label = screen.label || `Bildschirm ${index + 1}${screen.isPrimary ? " (Hauptbildschirm)" : ""}`;
  return { id, label, left, top, width, height, isPrimary: Boolean(screen.isPrimary) };
}

function fallbackLocalScreen() {
  const left = Math.round(Number(screen.availLeft ?? 0));
  const top = Math.round(Number(screen.availTop ?? 0));
  const width = Math.round(Number(screen.availWidth || screen.width || window.innerWidth || 1280));
  const height = Math.round(Number(screen.availHeight || screen.height || window.innerHeight || 720));
  return {
    id: localScreenId({ left, top, width, height }),
    label: "Aktueller Bildschirm",
    left,
    top,
    width,
    height,
    isPrimary: true,
  };
}

function localScreenId(screenInfo) {
  return `${screenInfo.left}:${screenInfo.top}:${screenInfo.width}x${screenInfo.height}`;
}

function renderWindowScreenDialog() {
  if (!els.windowScreenList) return;
  if (!localScreens.length) localScreens = [fallbackLocalScreen()];
  els.windowScreenList.innerHTML = LOCAL_WINDOW_TARGETS.map((target) => {
    const assignment = localWindowScreenAssignments[target.key];
    const selected = assignment?.id || "";
    const screenOptions =
      selected && !localScreens.some((screenInfo) => screenInfo.id === selected)
        ? [assignment, ...localScreens]
        : localScreens;
    return `
      <div class="window-screen-row">
        <div class="display-device">
          <strong>${escapeHtml(target.label)}</strong>
          <span class="muted">${escapeHtml(target.path)}</span>
        </div>
        <label>
          <span>Bildschirm</span>
          <select data-window-screen-assignment data-target="${escapeHtml(target.key)}">
            <option value="" ${selected ? "" : "selected"}>Standard / aktueller Bildschirm</option>
            ${screenOptions
              .map(
                (screenInfo) =>
                  `<option value="${escapeHtml(screenInfo.id)}" ${screenInfo.id === selected ? "selected" : ""}>${escapeHtml(screenLabel(screenInfo))}</option>`,
              )
              .join("")}
          </select>
        </label>
      </div>
    `;
  }).join("");
  if (els.windowScreenStatus) {
    els.windowScreenStatus.textContent =
      localScreenDetectionMessage ||
      "Die Fenster werden beim Start des Wettkampfs auf den gewaehlten Bildschirmen geoeffnet.";
  }
}

function screenLabel(screenInfo) {
  return `${screenInfo.label} - ${screenInfo.width} x ${screenInfo.height}${screenInfo.left || screenInfo.top ? ` - Position ${screenInfo.left}/${screenInfo.top}` : ""}`;
}

function setWindowScreenAssignment(targetKey, screenId) {
  if (!LOCAL_WINDOW_TARGETS.some((target) => target.key === targetKey)) return;
  const selectedScreen = localScreens.find((screenInfo) => screenInfo.id === screenId);
  if (selectedScreen) localWindowScreenAssignments[targetKey] = { ...selectedScreen };
  else delete localWindowScreenAssignments[targetKey];
  saveWindowScreenAssignments();
  renderWindowScreenDialog();
}

function loadWindowScreenAssignments() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WINDOW_SCREEN_ASSIGNMENTS_KEY) || "{}");
    const output = {};
    for (const target of LOCAL_WINDOW_TARGETS) {
      const assignment = parsed?.[target.key];
      if (typeof assignment === "string") output[target.key] = { id: assignment };
      else if (assignment?.id) {
        output[target.key] = {
          id: String(assignment.id),
          label: assignment.label ? String(assignment.label) : "Bildschirm",
          left: Math.round(Number(assignment.left) || 0),
          top: Math.round(Number(assignment.top) || 0),
          width: Math.max(320, Math.round(Number(assignment.width) || 1280)),
          height: Math.max(240, Math.round(Number(assignment.height) || 720)),
          isPrimary: Boolean(assignment.isPrimary),
        };
      }
    }
    return output;
  } catch (error) {
    return {};
  }
}

function saveWindowScreenAssignments() {
  localStorage.setItem(WINDOW_SCREEN_ASSIGNMENTS_KEY, JSON.stringify(localWindowScreenAssignments));
}

function assignedLocalScreen(targetKey) {
  const assignment = localWindowScreenAssignments[targetKey];
  if (!assignment?.id) return null;
  return localScreens.find((screenInfo) => screenInfo.id === assignment.id) || assignment;
}

function controlClientLabel(client) {
  return "verbunden";
}

function tabletClientLabel(client) {
  return "verbunden";
}

function isOwnControlClient(client) {
  return client?.id === controlClientToken || (Array.isArray(client?.ids) && client.ids.includes(controlClientToken));
}

function controlClientIdentity(client) {
  if (client?.identity) return client.identity;
  if (isHostClient(client)) return "host";
  return `remote:${client?.address || client?.id || "unknown"}`;
}

function isHostClient(client) {
  return Boolean(client?.isLocal) || client?.address === "127.0.0.1" || client?.address === "localhost";
}

function isHostView() {
  return ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
}

function renderJudgeConnectionStatus() {
  const judges = sessionInfo?.judges || state.meta.judgeConnections || {};
  const slots = getRefereeSlots();
  const connected = slots.filter((slot) => judges[slot.key]).length;

  return `
    <div class="connection-status-card">
      <div>
        <p class="eyebrow">Verbindung</p>
        <h3>${connected} / ${slots.length} verbunden</h3>
      </div>
      <div class="status-grid">
        ${slots
          .map((slot) => {
            const isConnected = Boolean(judges[slot.key]);
            return `
              <div class="status-dot-row">
                <span class="status-dot ${isConnected ? "online" : ""}"></span>
                <span>${slot.label}</span>
                <strong>${isConnected ? escapeHtml(judges[slot.key].name) : "offen"}</strong>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderCurrentAttempt() {
  const activeGroup = getActiveGroup();
  const activeGroupLabel = activeGroup ? `Gruppe ${activeGroup.name}` : "Aktive Gruppe";

  if (state.meta.mode === "finished") {
    els.currentAttempt.innerHTML = `
      <div class="current-grid">
        <div class="current-lifter">
          <p class="eyebrow">Abgeschlossen</p>
          <h2>Wettkampf beendet</h2>
          <p class="muted">Alle gültigen Totals stehen in der Wertung. Athleten ohne gültiges Reißen oder Stoßen bleiben ohne Total.</p>
        </div>
        <div class="decision-strip">
          <span class="decision-label">Protokoll gespeichert</span>
          <div class="form-actions">
            <button type="button" class="primary-button" data-action="generate-report">Ergebnisliste erstellen</button>
            <button type="button" class="ghost-button" data-action="export-data">Export</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (state.meta.mode === "snatchComplete") {
    els.currentAttempt.innerHTML = `
      <div class="current-grid">
        <div class="current-lifter">
          <p class="eyebrow">Reißen abgeschlossen</p>
          <h2>Alle Gruppen haben das Reißen beendet</h2>
          <p class="muted">Jetzt kann das Stoßen gestartet werden. Die Gruppen laufen wieder in der geplanten Reihenfolge.</p>
        </div>
        <div class="decision-strip">
          <span class="decision-label">Nächster Abschnitt</span>
          <button type="button" class="primary-button" data-action="start-clean-jerk">Stoßen starten</button>
        </div>
      </div>
    `;
    return;
  }

  if (state.meta.mode === "groupComplete") {
    const lift = state.meta.activeLift === "cleanJerk" ? "cleanJerk" : "snatch";
    const nextGroupId = lift === "cleanJerk" ? firstPendingGroupId() : null;
    const nextGroup = nextGroupId ? state.groups.find((group) => group.id === nextGroupId) : null;
    const liftLabel = LIFTS[lift].label;
    els.currentAttempt.innerHTML = `
      <div class="current-grid">
        <div class="current-lifter">
          <p class="eyebrow">${escapeHtml(activeGroupLabel)}</p>
          <h2>${liftLabel} abgeschlossen</h2>
          <p class="muted">${liftLabel} dieser Gruppe ist vollständig eingetragen.</p>
        </div>
        <div class="decision-strip">
          <span class="decision-label">${nextGroup ? `Nächste Gruppe: ${escapeHtml(nextGroup.name)}` : "Abschnitt fertig"}</span>
          <div class="form-actions">
            ${
              nextGroup
                ? `<button type="button" class="primary-button" data-action="start-next-group">Nächste Gruppe starten</button>`
                : lift === "snatch"
                  ? `<button type="button" class="primary-button" data-action="start-clean-jerk">Stoßen starten</button>`
                  : `<button type="button" class="primary-button" data-action="generate-report">Ergebnisliste erstellen</button>`
            }
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (state.meta.breakPending) {
    els.currentAttempt.innerHTML = `
      <div class="current-grid">
        <div class="current-lifter">
          <p class="eyebrow">${escapeHtml(activeGroupLabel)} · Reißen fertig</p>
          <h2>10 Minuten Pause</h2>
          <p class="muted">Danach beginnt das Stoßen mit den eingetragenen Anfangsgewichten.</p>
        </div>
        <div class="decision-strip">
          <span class="decision-label">Nächster Abschnitt</span>
          <button type="button" class="primary-button" data-action="start-clean-jerk">Stoßen starten</button>
        </div>
      </div>
    `;
    return;
  }

  const current = getCurrentAttempt();
  if (!current) {
    els.currentAttempt.innerHTML = `
      <div class="current-grid">
        <div class="current-lifter">
          <p class="eyebrow">Keine offenen Versuche</p>
          <h2>${LIFTS[state.meta.activeLift].label}</h2>
          <p class="muted">Für diesen Abschnitt sind keine weiteren Versuche eingetragen.</p>
        </div>
      </div>
    `;
    return;
  }

  const key = attemptKey(current);
  ensureDraftKey(key);
  const votes = judgeDraft.votes;
  const techniquePoints = techniqueDraft.points;
  const slots = getRefereeSlots();
  const activeVotes = slots.map((slot) => votes[slot.voteIndex]);
  const goodVotes = activeVotes.filter(Boolean).length;
  const redVotes = activeVotes.filter((vote) => vote === false).length;
  const openVotes = activeVotes.filter((vote) => vote === null).length;
  const decision =
    activeVotes.some((vote) => vote === null)
      ? "Offen"
      : goodVotes >= getRequiredGoodVotes()
        ? "Gültiger Versuch"
        : "Ungültiger Versuch";
  const plannedNextDefault =
    current.attemptNo < 3
      ? Math.max(current.weight + 1, parseInteger(current.athlete.next[current.lift]) || current.weight + 1)
      : null;
  const plannedNextValue =
    plannedNextDraft.key === key && plannedNextDraft.weight ? plannedNextDraft.weight : plannedNextDefault;
  const showTechnique = shouldUseTechnique(current.athlete);
  const activeTechniquePoints = showTechnique ? getActiveTechniquePoints(current, slots) : [];
  const hasAllVotes = activeVotes.every((vote) => vote !== null);
  const hasAllTechnique = !showTechnique || activeTechniquePoints.every((point) => point !== null);
  const hasNextWeight = current.attemptNo >= 3 || Boolean(parseInteger(plannedNextValue));
  const canWriteAttempt = hasAllVotes && hasAllTechnique && hasNextWeight && !nextWeightWarning(current.athlete, current.lift, current.weight);

  els.currentAttempt.innerHTML = `
    <div class="current-grid">
      <div class="current-lifter">
        <p class="eyebrow">Aktueller Versuch</p>
        <h2>${escapeHtml(current.athlete.name)}</h2>
        <div class="attempt-meta">
          <span>Gruppe ${escapeHtml(groupNameById(current.athlete.groupId))}</span>
          <span>${escapeHtml(ageClassLabel(current.athlete.ageClass))}</span>
          <span>${escapeHtml(formatWeightClass(current.athlete.weightClass))}</span>
          <span>${LIFTS[current.lift].label}</span>
          <span>Versuch ${current.attemptNo}</span>
          <span>${escapeHtml(current.athlete.team || "ohne Verein")}</span>
        </div>
        <div class="weight-line">
          <label>
            <span>Versuchsgewicht</span>
            <input id="current-weight" class="weight-input" type="number" min="${minimumAttemptWeightForAthlete(current.athlete)}" step="1" value="${current.weight}" data-field="next-${current.lift}" data-id="${current.athlete.id}" data-key="${key}" />
          </label>
          <strong>${current.weight} kg</strong>
        </div>
        ${renderWeightWarning(current)}
        ${
          plannedNextDefault
            ? `
              <label class="next-weight-box">
                <span>Nächster Versuch nach Eintrag</span>
                <input id="planned-next-weight" class="weight-input" type="number" min="${current.weight}" step="1" value="${plannedNextValue}" />
              </label>
              <p class="muted">Bei ungültigem Versuch darf dieses Feld auf ${current.weight} kg gesetzt werden.</p>
            `
            : ""
        }
      </div>
      <div class="referee-panel write-panel">
        ${renderJudgeConnectionStatus()}
        <div class="judge-grid ${slots.length === 1 ? "single" : ""}">
          ${slots.map((slot) => {
            const judge = (sessionInfo?.judges || state.meta.judgeConnections || {})[slot.key];
            const vote = votes[slot.voteIndex];
            const techniquePoint = techniquePoints[slot.voteIndex];
            const voteText = vote === true ? "Weiß" : vote === false ? "Rot" : "offen";
            const voteClass = vote === true ? "ok-text" : vote === false ? "bad-text" : "muted";
            return `
              <div class="judge-column">
                <span>${slot.label}</span>
                <strong>${escapeHtml(judge?.name || "nicht verbunden")}</strong>
                <small class="${voteClass}">${voteText}</small>
                ${
                  showTechnique
                    ? `<small class="muted">Technik: ${techniquePoint === null ? "offen" : `${formatScore(techniquePoint)} P`}</small>`
                    : ""
                }
              </div>
            `;
          }).join("")}
        </div>
        <div class="decision-strip compact-decision">
          <div>
            <span class="decision-label">${decision}</span>
            <p class="muted">${goodVotes} weiß · ${redVotes} rot · ${openVotes} offen${showTechnique ? ` · Technik ${formatTechniqueSummary(current, slots)}` : ""}</p>
          </div>
          <div class="form-actions">
            <button type="button" class="primary-button" data-action="record-attempt" data-testid="record-attempt" ${canWriteAttempt ? "" : "disabled"}>Schreiben</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openPlateWindow() {
  const plateWindow = openCompetitionWindow("plates");
  if (!plateWindow) {
    showToast("Scheibenfenster wurde vom Browser blockiert. Bitte Pop-ups für diese App erlauben.");
    return;
  }
  plateWindow.focus();
}

function openScoreboardWindow() {
  const scoreboardWindow = openCompetitionWindow("scoreboard");
  if (!scoreboardWindow) {
    showToast("Ergebnisfenster wurde vom Browser blockiert. Bitte Pop-ups für diese App erlauben.");
    return;
  }
  scoreboardWindow.focus();
}

function openWaitingRoomDisplayWindow() {
  const waitingRoomWindow = openCompetitionWindow("waitingRoom");
  if (!waitingRoomWindow) {
    showToast("Warteraum-Anzeige wurde vom Browser blockiert. Bitte Pop-ups erlauben.");
    return;
  }
  waitingRoomWindow.focus();
}

function openCompetitionWindow(targetKey) {
  const target = localWindowTargetByKey(targetKey);
  if (!target) return null;
  const assignedScreen = assignedLocalScreen(target.key);
  const popup = window.open(target.path, target.windowName, windowFeaturesForTarget(target, assignedScreen));
  if (popup && assignedScreen) {
    try {
      popup.moveTo(assignedScreen.left, assignedScreen.top);
      popup.resizeTo(
        Math.min(target.width, assignedScreen.width),
        Math.min(target.height, assignedScreen.height),
      );
    } catch (error) {
      // Manche Browser lassen das Verschieben nur direkt beim Oeffnen zu.
    }
  }
  return popup;
}

function localWindowTargetByKey(key) {
  return LOCAL_WINDOW_TARGETS.find((target) => target.key === key) || null;
}

function windowFeaturesForTarget(target, assignedScreen) {
  const width = assignedScreen ? Math.min(target.width, assignedScreen.width) : target.width;
  const height = assignedScreen ? Math.min(target.height, assignedScreen.height) : target.height;
  const parts = ["popup=yes", `width=${width}`, `height=${height}`];
  if (assignedScreen) {
    parts.push(`left=${assignedScreen.left}`, `top=${assignedScreen.top}`);
    parts.push(`screenX=${assignedScreen.left}`, `screenY=${assignedScreen.top}`);
  }
  return parts.join(",");
}

function renderQueue() {
  const queue = state.meta.mode === "competition" && !state.meta.breakPending
    ? getQueue(state.meta.activeLift)
    : [];
  els.queueCount.textContent = `${queue.length}`;

  if (!queue.length) {
    els.queueTable.innerHTML = `<tr><td colspan="5" class="muted">Keine offenen Versuche.</td></tr>`;
    return;
  }

  els.queueTable.innerHTML = queue
    .slice(0, 16)
    .map((item, index) => {
      const warning = nextWeightWarning(item.athlete, item.lift, item.weight);
      return `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(item.athlete.name)}</strong><br><span class="muted">Gruppe ${escapeHtml(groupNameById(item.athlete.groupId))}</span></td>
          <td>${LIFTS[item.lift].short}${item.attemptNo}</td>
          <td>
            <input class="weight-input" type="number" min="${minimumAttemptWeightForAthlete(item.athlete)}" step="1" value="${item.weight}" data-field="next-${item.lift}" data-id="${item.athlete.id}" aria-label="Nächstes Gewicht für ${escapeHtml(item.athlete.name)}" />
          </td>
          <td class="${warning ? "warning-text" : "muted"}">${warning || "wartet"}</td>
        </tr>
      `;
    })
    .join("");
}

function renderStandings() {
  const athletes = getDisplayAthletes();
  const done = countAttempts(athletes);
  const total = athletes.length * 6;
  els.progressPill.textContent = `${done} / ${total}`;

  if (isIwfMode()) {
    renderIwfStandings(athletes);
    return;
  }

  if (els.standingsHead) {
    els.standingsHead.innerHTML = `
      <tr>
        <th>Rang</th>
        <th>Athlet</th>
        <th>R</th>
        <th>S</th>
        <th>Total</th>
        <th>Abzug</th>
        <th>Nach Abzug</th>
      </tr>
    `;
  }

  const standings = getStandings(athletes);

  if (!standings.length) {
    els.standingsTable.innerHTML = `<tr><td colspan="7" class="muted">Noch keine Wertung.</td></tr>`;
    return;
  }

  els.standingsTable.innerHTML = standings
    .map((row, index) => `
      <tr>
        <td>${row.total ? index + 1 : "-"}</td>
        <td><strong>${escapeHtml(row.athlete.name)}</strong><br><span class="muted">Gruppe ${escapeHtml(groupNameById(row.athlete.groupId))}</span></td>
        <td>${row.snatch || "-"}</td>
        <td>${row.cleanJerk || "-"}</td>
        <td><strong>${row.total || "DNF"}</strong></td>
        <td>${formatScore(row.deduction)}</td>
        <td><strong>${row.total ? formatScore(row.relativeTotal) : "-"}</strong></td>
      </tr>
    `)
    .join("");
}

function renderIwfStandings(athletes) {
  const standings = getIwfStandings(athletes);
  if (els.standingsHead) {
    els.standingsHead.innerHTML = `
      <tr>
        <th>Rang</th>
        <th>Athlet</th>
        <th>Altersklasse</th>
        <th>IWF-Klasse</th>
        <th>R</th>
        <th>Rang R</th>
        <th>S</th>
        <th>Rang S</th>
        <th>Total</th>
        <th>Status</th>
      </tr>
    `;
  }

  if (!standings.length) {
    els.standingsTable.innerHTML = `<tr><td colspan="10" class="muted">Noch keine IWF-Wertung.</td></tr>`;
    return;
  }

  els.standingsTable.innerHTML = standings
    .map((row) => `
      <tr>
        <td>${row.totalRank || "-"}</td>
        <td><strong>${escapeHtml(row.athlete.name)}</strong><br><span class="muted">${escapeHtml(teamNameById(row.athlete.teamId))} &middot; Gruppe ${escapeHtml(groupNameById(row.athlete.groupId))}</span></td>
        <td>${escapeHtml(ageClassLabel(row.athlete.ageClass))}</td>
        <td>${escapeHtml(row.iwfBodyweightCategory)}</td>
        <td>${row.hasValidSnatch ? row.bestSnatch : "-"}</td>
        <td>${row.snatchRank || "-"}</td>
        <td>${row.hasValidCleanAndJerk ? row.bestCleanAndJerk : "-"}</td>
        <td>${row.cleanJerkRank || "-"}</td>
        <td><strong>${row.hasValidTotal ? row.total : "DNF"}</strong></td>
        <td>${formatIwfStatus(row.status)}</td>
      </tr>
    `)
    .join("");
}

function renderTeamStandings() {
  if (!els.teamStandingsTable) return;
  if (isIwfMode()) {
    renderIwfTeamStandings();
    return;
  }

  if (els.teamStandingsHead) {
    els.teamStandingsHead.innerHTML = `
      <tr>
        <th>Rang</th>
        <th>Mannschaft</th>
        <th>Wertende</th>
        <th>Relativpunkte</th>
        <th>Ohne Ergebnis</th>
      </tr>
    `;
  }

  const standings = getTeamStandings();
  if (els.teamCount) els.teamCount.textContent = `${standings.length}`;

  if (!standings.length) {
    els.teamStandingsTable.innerHTML = `<tr><td colspan="5" class="muted">Noch keine Mannschaftswertung.</td></tr>`;
    return;
  }

  els.teamStandingsTable.innerHTML = standings
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(row.team.name)}</strong><br><span class="muted">Top ${row.maxScorers} in Wertung</span></td>
          <td>${row.scoringCount} / ${row.assignedCount}</td>
          <td><strong>${formatScore(row.score)}</strong></td>
          <td>${row.openCount || "-"}</td>
        </tr>
      `,
    )
    .join("");
}

function renderIwfTeamStandings() {
  if (els.teamStandingsHead) {
    els.teamStandingsHead.innerHTML = `
      <tr>
        <th>Rang</th>
        <th>Mannschaft</th>
        <th>R-Punkte</th>
        <th>S-Punkte</th>
        <th>Total-Punkte</th>
        <th>Gesamt</th>
        <th>Ohne Total</th>
      </tr>
    `;
  }

  const standings = calculateIwfTeamPoints();
  if (els.teamCount) els.teamCount.textContent = `${standings.length}`;

  if (!standings.length) {
    els.teamStandingsTable.innerHTML = `<tr><td colspan="7" class="muted">Noch keine IWF-Mannschaftswertung.</td></tr>`;
    return;
  }

  els.teamStandingsTable.innerHTML = standings
    .map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(row.team.name)}</strong><br><span class="muted">${row.classifiedCount} / ${row.assignedCount} mit Total</span></td>
        <td>${row.snatchPoints}</td>
        <td>${row.cleanJerkPoints}</td>
        <td>${row.totalPoints}</td>
        <td><strong>${row.totalTeamPoints}</strong></td>
        <td>${row.noTotalCount || "-"}</td>
      </tr>
    `)
    .join("");
}

function renderProtocol() {
  const athletes = getDisplayAthletes();
  if (!athletes.length) {
    els.protocolTable.innerHTML = `<tr><td colspan="8" class="muted">Keine Athleten in dieser Gruppe.</td></tr>`;
    return;
  }

  els.protocolTable.innerHTML = athletes
    .map((athlete) => {
      const snatch = [1, 2, 3].map((attemptNo) => renderAttemptCell(athlete, "snatch", attemptNo)).join("");
      const cleanJerk = [1, 2, 3].map((attemptNo) => renderAttemptCell(athlete, "cleanJerk", attemptNo)).join("");
      const total = bestWeight(athlete, "snatch") && bestWeight(athlete, "cleanJerk")
        ? bestWeight(athlete, "snatch") + bestWeight(athlete, "cleanJerk")
        : "-";
      return `
        <tr>
          <td><strong>${escapeHtml(athlete.name)}</strong></td>
          ${snatch}
          ${cleanJerk}
          <td><strong>${total}</strong></td>
        </tr>
      `;
    })
    .join("");
}

function renderAttemptCell(athlete, lift, attemptNo) {
  const attempt = athlete.attempts[lift][attemptNo - 1];
  if (!attempt) return `<td><span class="attempt-cell empty">-</span></td>`;
  const marker = attempt.good ? "✓" : "×";
  const cls = attempt.good ? "good" : "bad";
  const counts = getVoteCounts(attempt);
  const votes = `${counts.white}W · ${counts.red}R`;
  const technique =
    attempt.techniqueScore !== null && attempt.techniqueScore !== undefined
      ? `<br><span class="muted">T ${formatScore(attempt.techniqueScore)}</span>`
      : "";
  return `<td><span class="attempt-cell ${cls}">${attempt.requestedWeight} ${marker}</span><br><span class="muted">${votes}</span>${technique}</td>`;
}

function getVoteCounts(attempt) {
  if (attempt?.votes && Number.isInteger(attempt.votes.white) && Number.isInteger(attempt.votes.red)) {
    return { white: attempt.votes.white, red: attempt.votes.red };
  }
  if (Array.isArray(attempt?.judges)) {
    const white = attempt.judges.filter(Boolean).length;
    return { white, red: attempt.judges.length - white };
  }
  return { white: 0, red: 0 };
}

function renderWeightWarning(current) {
  const warning = nextWeightWarning(current.athlete, current.lift, current.weight);
  return warning ? `<p class="warning-text">${warning}</p>` : "";
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

function ensureDraftKey(key) {
  if (!state.meta.liveVotes || state.meta.liveVotes.key !== key) {
    state.meta.liveVotes = { key, votes: [null, null, null] };
  }
  if (!state.meta.liveTechnique || state.meta.liveTechnique.key !== key) {
    state.meta.liveTechnique = { key, points: [null, null, null] };
  }
  judgeDraft = state.meta.liveVotes;
  techniqueDraft = state.meta.liveTechnique;
}

function minimumAttemptWeightForAthlete(athlete) {
  if (isIwfMode()) {
    const iwfGender = athleteIwfGender(athlete);
    return IWF_MINIMUM_ATTEMPT_WEIGHT[iwfGender] || barWeightForAthlete(athlete);
  }
  return barWeightForAthlete(athlete);
}

function iwfAthleteStartWarning(athlete) {
  const iwfGender = athleteIwfGender(athlete);
  const iwfAgeGroup = iwfAgeGroupForAthlete(athlete);
  if (!iwfGender || !iwfAgeGroup) return "keine IWF-Wertungskategorie";

  const minimumWeight = minimumAttemptWeightForAthlete(athlete);
  if (Number(athlete.openers?.snatch) < minimumWeight || Number(athlete.openers?.cleanJerk) < minimumWeight) {
    return `IWF-Mindestgewicht ${minimumWeight} kg`;
  }

  const entryTotal = parseInteger(athlete.entryTotal);
  if (!entryTotal) return "Entry Total fehlt";

  const openerTotal = Number(athlete.openers?.snatch || 0) + Number(athlete.openers?.cleanJerk || 0);
  if (openerTotal < entryTotal - 20) return "20-kg-Regel pruefen";

  return "";
}

function nextWeightWarning(athlete, lift, weight) {
  if (!Number.isInteger(weight) || weight < 1) return "Gewicht prüfen";
  const minimumWeight = minimumAttemptWeightForAthlete(athlete);
  if (weight < minimumWeight) {
    return isIwfMode()
      ? `IWF-Mindestgewicht ${minimumWeight} kg`
      : `mindestens Stangengewicht ${minimumWeight} kg`;
  }
  const best = bestWeight(athlete, lift);
  if (best && weight <= best) return `nach gültigem Versuch min. ${best + 1} kg`;
  return "";
}

function athleteSetupWarning(athlete) {
  if (!athlete.name || !athlete.ageClass || !athlete.weightClass) return "Meldung prüfen";
  if (normalizeAgeClass(athlete.ageClass) === "masters" && !parseOptionalBirthYear(athlete.birthYear)) return "Jahrgang fehlt";
  if (!athlete.bodyweight || !athlete.openers?.snatch || !athlete.openers?.cleanJerk) return "Waage offen";
  if (isIwfMode()) {
    const warning = iwfAthleteStartWarning(athlete);
    if (warning) return warning;
  }
  if (athlete.entryTotal && athlete.openers.snatch + athlete.openers.cleanJerk < athlete.entryTotal - 20) {
    return "20-kg-Regel prüfen";
  }
  return "";
}

function getStandings(athletes = state.athletes) {
  return athletes
    .filter((athlete) => !athlete.withdrawn)
    .map((athlete) => {
      const snatch = bestWeight(athlete, "snatch");
      const cleanJerk = bestWeight(athlete, "cleanJerk");
      const cleanAttempt = bestAttempt(athlete, "cleanJerk");
      const total = snatch && cleanJerk ? snatch + cleanJerk : 0;
      const deduction = getRelativeDeduction(athlete);
      const technique = getTechniqueTotal(athlete);
      const relativeSnatch = snatch ? roundScore(snatch - deduction) : 0;
      const relativeCleanJerk = cleanJerk ? roundScore(cleanJerk - deduction) : 0;
      const relativeTotal = total ? roundScore(relativeSnatch + relativeCleanJerk) : 0;
      const scoreBeforeAge = total ? roundScore(relativeTotal + technique) : 0;
      const ageFactor = getAgeFactor(athlete);
      const ageAdjustedScore = total ? roundScore(scoreBeforeAge * ageFactor) : 0;
      const score = ageAdjustedScore;
      return {
        athlete,
        snatch,
        cleanJerk,
        total,
        deduction,
        relativeSnatch,
        relativeCleanJerk,
        relativeTotal,
        technique,
        scoreBeforeAge,
        ageFactor,
        ageAdjustedScore,
        score,
        cleanAttemptNo: cleanAttempt?.attemptNo || 99,
        cleanSequence: cleanAttempt?.sequence || 999999,
      };
    })
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.total !== b.total) return b.total - a.total;
      if (a.cleanJerk !== b.cleanJerk) return b.cleanJerk - a.cleanJerk;
      if (a.cleanAttemptNo !== b.cleanAttemptNo) return a.cleanAttemptNo - b.cleanAttemptNo;
      if (a.cleanSequence !== b.cleanSequence) return a.cleanSequence - b.cleanSequence;
      return a.athlete.startNo - b.athlete.startNo;
    });
}

function getTeamStandings(athletes = state.athletes) {
  const eligibleAthletes = athletes.filter((athlete) => !athlete.withdrawn);
  const individualRows = getStandings(eligibleAthletes);
  const rowByAthlete = new Map(individualRows.map((row) => [row.athlete.id, row]));
  return getTeams()
    .map((team) => {
      const members = eligibleAthletes.filter((athlete) => athlete.teamId === team.id);
      const validRows = members
        .map((athlete) => rowByAthlete.get(athlete.id))
        .filter((row) => row && row.total && Number.isFinite(row.score));
      const maxScorers = teamMaxScorers(team);
      const scoringRows = validRows.slice(0, maxScorers);
      const score = roundScore(scoringRows.reduce((sum, row) => sum + row.score, 0));
      return {
        team,
        maxScorers,
        members,
        assignedCount: members.length,
        scoringRows,
        scoringCount: scoringRows.length,
        openCount: Math.max(0, members.length - validRows.length),
        score,
      };
    })
    .filter((row) => row.assignedCount > 0 || row.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.scoringCount !== b.scoringCount) return b.scoringCount - a.scoringCount;
      return a.team.name.localeCompare(b.team.name, "de-DE", { numeric: true });
    });
}

function calculateIwfAthleteResult(athlete) {
  const snatchAttempt = bestAttempt(athlete, "snatch");
  const cleanAttempt = bestAttempt(athlete, "cleanJerk");
  const iwfGender = athleteIwfGender(athlete);
  const iwfAgeGroup = iwfAgeGroupForAthlete(athlete);
  const isIwfEligible = Boolean(iwfGender && iwfAgeGroup);
  const hasValidSnatch = isIwfEligible && Boolean(snatchAttempt);
  const hasValidCleanAndJerk = isIwfEligible && Boolean(cleanAttempt);
  const bestSnatch = hasValidSnatch ? snatchAttempt.requestedWeight : 0;
  const bestCleanAndJerk = hasValidCleanAndJerk ? cleanAttempt.requestedWeight : 0;
  const hasValidTotal = hasValidSnatch && hasValidCleanAndJerk;
  const total = hasValidTotal ? bestSnatch + bestCleanAndJerk : 0;
  const status = !isIwfEligible
    ? "not-iwf"
    : hasValidTotal
      ? "valid-total"
      : hasAnyRecordedAttempt(athlete)
        ? "no-total"
        : "not-started";

  return {
    athlete,
    bestSnatch,
    bestCleanAndJerk,
    total,
    hasValidSnatch,
    hasValidCleanAndJerk,
    hasValidTotal,
    bestSnatchAttemptOrder: attemptOrder(snatchAttempt),
    bestCleanAndJerkAttemptOrder: attemptOrder(cleanAttempt),
    totalTieBreakAttemptOrder: attemptOrder(cleanAttempt),
    iwfBodyweightCategory: getIwfBodyweightCategory(iwfGender, athlete.bodyweight, athlete.ageClass),
    iwfAgeGroup,
    iwfGender,
    isIwfEligible,
    classificationKey: iwfClassificationKey(athlete),
    status,
  };
}

function rankIwfAthletesBySnatch(athletes) {
  return (athletes || [])
    .map(calculateIwfAthleteResult)
    .filter((row) => row.hasValidSnatch)
    .sort(compareIwfSnatchRows);
}

function rankIwfAthletesByCleanAndJerk(athletes) {
  return (athletes || [])
    .map(calculateIwfAthleteResult)
    .filter((row) => row.hasValidCleanAndJerk)
    .sort(compareIwfCleanAndJerkRows);
}

function rankIwfAthletesByTotal(athletes) {
  return (athletes || [])
    .map(calculateIwfAthleteResult)
    .filter((row) => row.hasValidTotal)
    .sort(compareIwfTotalRows);
}

function compareIwfSnatchRows(a, b) {
  if (a.bestSnatch !== b.bestSnatch) return b.bestSnatch - a.bestSnatch;
  if (a.bestSnatchAttemptOrder !== b.bestSnatchAttemptOrder) return a.bestSnatchAttemptOrder - b.bestSnatchAttemptOrder;
  return iwfFallbackSort(a, b);
}

function compareIwfCleanAndJerkRows(a, b) {
  if (a.bestCleanAndJerk !== b.bestCleanAndJerk) return b.bestCleanAndJerk - a.bestCleanAndJerk;
  if (a.bestCleanAndJerkAttemptOrder !== b.bestCleanAndJerkAttemptOrder) {
    return a.bestCleanAndJerkAttemptOrder - b.bestCleanAndJerkAttemptOrder;
  }
  return iwfFallbackSort(a, b);
}

function compareIwfTotalRows(a, b) {
  if (a.total !== b.total) return b.total - a.total;
  if (a.totalTieBreakAttemptOrder !== b.totalTieBreakAttemptOrder) {
    return a.totalTieBreakAttemptOrder - b.totalTieBreakAttemptOrder;
  }
  return iwfFallbackSort(a, b);
}

function iwfFallbackSort(a, b) {
  const groupDiff = groupNameById(a.athlete.groupId).localeCompare(groupNameById(b.athlete.groupId), "de-DE", { numeric: true });
  if (groupDiff) return groupDiff;
  return String(a.athlete.name).localeCompare(String(b.athlete.name), "de-DE", { numeric: true });
}

function getIwfRankMaps(athletes = state.athletes) {
  const eligibleAthletes = (athletes || []).filter((athlete) => !athlete.withdrawn);
  const results = eligibleAthletes.map(calculateIwfAthleteResult);
  const byClass = new Map();
  for (const row of results) {
    const key = row.classificationKey;
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key).push(row);
  }

  const snatch = new Map();
  const cleanJerk = new Map();
  const total = new Map();
  for (const rows of byClass.values()) {
    rows.filter((row) => row.hasValidSnatch).sort(compareIwfSnatchRows).forEach((row, index) => snatch.set(row.athlete.id, index + 1));
    rows
      .filter((row) => row.hasValidCleanAndJerk)
      .sort(compareIwfCleanAndJerkRows)
      .forEach((row, index) => cleanJerk.set(row.athlete.id, index + 1));
    rows.filter((row) => row.hasValidTotal).sort(compareIwfTotalRows).forEach((row, index) => total.set(row.athlete.id, index + 1));
  }
  return { results, snatch, cleanJerk, total };
}

function getIwfStandings(athletes = state.athletes) {
  const ranks = getIwfRankMaps(athletes);
  return ranks.results
    .map((row) => ({
      ...row,
      snatchRank: ranks.snatch.get(row.athlete.id) || null,
      cleanJerkRank: ranks.cleanJerk.get(row.athlete.id) || null,
      totalRank: ranks.total.get(row.athlete.id) || null,
    }))
    .sort((a, b) => {
      if (a.hasValidTotal !== b.hasValidTotal) return a.hasValidTotal ? -1 : 1;
      if (a.hasValidTotal && b.hasValidTotal) return compareIwfTotalRows(a, b);
      if (a.hasValidSnatch !== b.hasValidSnatch) return a.hasValidSnatch ? -1 : 1;
      if (a.hasValidCleanAndJerk !== b.hasValidCleanAndJerk) return a.hasValidCleanAndJerk ? -1 : 1;
      return iwfFallbackSort(a, b);
    });
}

function calculateIwfTeamPoints(athletes = state.athletes) {
  const eligibleAthletes = athletes.filter((athlete) => !athlete.withdrawn);
  const ranks = getIwfRankMaps(eligibleAthletes);
  const rowByAthlete = new Map(ranks.results.map((row) => [row.athlete.id, row]));
  return getTeams()
    .map((team) => {
      const members = eligibleAthletes.filter((athlete) => athlete.teamId === team.id);
      const athleteRows = members.map((athlete) => {
        const row = rowByAthlete.get(athlete.id) || calculateIwfAthleteResult(athlete);
        const snatchRank = ranks.snatch.get(athlete.id) || null;
        const cleanJerkRank = ranks.cleanJerk.get(athlete.id) || null;
        const totalRank = ranks.total.get(athlete.id) || null;
        return {
          ...row,
          snatchRank,
          cleanJerkRank,
          totalRank,
          snatchPoints: row.hasValidSnatch ? getIwfPlacementPoints(snatchRank) : 0,
          cleanJerkPoints: row.hasValidCleanAndJerk ? getIwfPlacementPoints(cleanJerkRank) : 0,
          totalPoints: row.hasValidTotal ? getIwfPlacementPoints(totalRank) : 0,
        };
      });
      const snatchPoints = athleteRows.reduce((sum, row) => sum + row.snatchPoints, 0);
      const cleanJerkPoints = athleteRows.reduce((sum, row) => sum + row.cleanJerkPoints, 0);
      const totalPoints = athleteRows.reduce((sum, row) => sum + row.totalPoints, 0);
      const totalTeamPoints = snatchPoints + cleanJerkPoints + totalPoints;
      const placementCounts = getIwfTeamPlacementCounts(athleteRows);
      return {
        team,
        members,
        athleteRows,
        snatchPoints,
        cleanJerkPoints,
        totalPoints,
        totalTeamPoints,
        placementCounts,
        classifiedCount: athleteRows.filter((row) => row.hasValidTotal).length,
        assignedCount: members.length,
        noTotalCount: athleteRows.filter((row) => !row.hasValidTotal).length,
      };
    })
    .filter((row) => row.assignedCount > 0 || row.totalTeamPoints > 0)
    .sort(compareIwfTeamRows);
}

function getIwfTeamPlacementCounts(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    [row.snatchRank, row.cleanJerkRank, row.totalRank].forEach((rank) => {
      const index = parseInteger(rank);
      if (index >= 1 && index <= 25) counts.set(index, (counts.get(index) || 0) + 1);
    });
  });
  return counts;
}

function compareIwfTeamRows(a, b) {
  if (a.totalTeamPoints !== b.totalTeamPoints) return b.totalTeamPoints - a.totalTeamPoints;
  for (let rank = 1; rank <= 25; rank += 1) {
    const diff = (b.placementCounts?.get(rank) || 0) - (a.placementCounts?.get(rank) || 0);
    if (diff) return diff;
  }
  return a.team.name.localeCompare(b.team.name, "de-DE", { numeric: true });
}

function getIwfPlacementPoints(rank) {
  const index = parseInteger(rank);
  return index >= 1 && index < IWF_PLACEMENT_POINTS.length ? IWF_PLACEMENT_POINTS[index] : 0;
}

function getIwfBodyweightCategory(gender, bodyweightKg, ageClass = "senior") {
  if (gender !== "female" && gender !== "male") return "keine IWF-Klasse";
  const genderKey = gender === "female" ? "female" : "male";
  const ageGroup = iwfAgeGroupKey(ageClass);
  if (!ageGroup) return "keine IWF-Klasse";
  const bodyweight = parseFloatSafe(bodyweightKg);
  if (!Number.isFinite(bodyweight) || bodyweight <= 0) return "-";
  const limits = IWF_BODYWEIGHT_CATEGORIES[ageGroup]?.[genderKey] || IWF_BODYWEIGHT_CATEGORIES.senior[genderKey];
  const limit = limits.find((max) => bodyweight <= max + 0.0001);
  return limit ? `bis ${formatScore(limit)} kg` : `+${formatScore(limits[limits.length - 1])} kg`;
}

function iwfAgeGroupKey(ageClass) {
  const normalized = normalizeAgeClass(ageClass);
  if (normalized === "children") return null;
  if (normalized === "school" || normalized === "youth") return "youth";
  if (normalized === "junior") return "junior";
  return "senior";
}

function iwfAgeGroupForAthlete(athlete) {
  return iwfAgeGroupKey(athlete?.ageClass);
}

function iwfAgeGroupLabel(ageClass) {
  const key = iwfAgeGroupKey(ageClass);
  return key ? IWF_AGE_GROUP_LABELS[key] || key : "keine IWF-Altersgruppe";
}

function formatIwfStatus(status) {
  if (status === "valid-total") return "G&uuml;ltiger Total";
  if (status === "no-total") return "Kein Total";
  if (status === "not-started") return "Nicht angetreten";
  if (status === "not-iwf") return "Keine IWF-Wertung";
  return "-";
}

function athleteIwfGender(athlete) {
  const category = getCategory(athlete?.gender);
  if (category.relativeKey === "female" || category.weightClassType === "female") return "female";
  if (category.relativeKey === "male" || category.weightClassType === "male") return "male";
  return null;
}

function iwfClassificationKey(athlete) {
  const gender = athleteIwfGender(athlete);
  const ageGroup = iwfAgeGroupForAthlete(athlete);
  return `${ageGroup || "none"}:${gender || "none"}:${getIwfBodyweightCategory(gender, athlete?.bodyweight, athlete?.ageClass)}`;
}

function hasAnyRecordedAttempt(athlete) {
  return Boolean((athlete?.attempts?.snatch || []).length || (athlete?.attempts?.cleanJerk || []).length);
}

function attemptOrder(attempt) {
  return parseInteger(attempt?.sequence) || Number.MAX_SAFE_INTEGER;
}

function bestWeight(athlete, lift) {
  return Math.max(0, ...athlete.attempts[lift].filter((attempt) => attempt.good).map((attempt) => attempt.requestedWeight));
}

function bestAttempt(athlete, lift) {
  return [...athlete.attempts[lift]]
    .filter((attempt) => attempt.good)
    .sort((a, b) => {
      if (a.requestedWeight !== b.requestedWeight) return b.requestedWeight - a.requestedWeight;
      if (a.attemptNo !== b.attemptNo) return a.attemptNo - b.attemptNo;
      return a.sequence - b.sequence;
    })[0];
}

function getRelativeDeduction(athlete) {
  const bodyweight = Number(athlete?.bodyweight);
  if (!Number.isFinite(bodyweight) || bodyweight <= 0) return 0;

  const table = getRelativeTable(relativeKeyForAthlete(athlete));
  if (!table.length) return 0;

  const sorted = [...table].sort((a, b) => a.bodyweight - b.bodyweight);
  let match = sorted[0];
  for (const row of sorted) {
    if (bodyweight >= row.bodyweight) match = row;
    if (bodyweight < row.bodyweight) break;
  }
  return Number(match?.deduction) || 0;
}

function getAgeFactor(athlete) {
  if (normalizeAgeClass(athlete?.ageClass) !== "masters") return 1;
  const age = athleteAge(athlete);
  if (!Number.isFinite(age)) return 1;
  const table = getAgeFactorTable(ageFactorKeyForAthlete(athlete))
    .map((row) => ({ age: parseInteger(row.age), factor: parseFloatSafe(row.factor) }))
    .filter((row) => Number.isFinite(row.age) && Number.isFinite(row.factor) && row.factor > 0);
  const sorted = [...table].sort((a, b) => a.age - b.age);
  let match = null;
  for (const row of sorted) {
    if (age >= row.age) match = row;
    if (age < row.age) break;
  }
  return parseFloatSafe(match?.factor) || 1;
}

function ageFactorKeyForAthlete(athlete) {
  const category = getCategory(athlete?.gender);
  return category.relativeKey === "female" || category.weightClassType === "female" ? "female" : "male";
}

function athleteAge(athlete) {
  const birthYear = parseOptionalBirthYear(athlete?.birthYear);
  if (!birthYear) return null;
  return competitionYear() - birthYear;
}

function competitionYear() {
  const today = new Date();
  return Number.isFinite(today.getFullYear()) ? today.getFullYear() : new Date().getFullYear();
}

function shouldShowAgeFactorColumn(athletes = state.athletes) {
  return athletes.some((athlete) => normalizeAgeClass(athlete.ageClass) === "masters");
}

function getTechniqueTotal(athlete) {
  if (!shouldUseTechnique(athlete)) return 0;
  return roundScore(bestTechniqueScore(athlete, "snatch") + bestTechniqueScore(athlete, "cleanJerk"));
}

function bestTechniqueScore(athlete, lift) {
  return Math.max(
    0,
    ...(athlete.attempts?.[lift] || [])
      .map((attempt) => Number(attempt.techniqueScore))
      .filter((value) => Number.isFinite(value)),
  );
}

function getActiveTechniquePoints(current, slots = getRefereeSlots()) {
  if (!shouldUseTechnique(current?.athlete)) return [];
  ensureDraftKey(attemptKey(current));
  return slots.map((slot) => {
    const point = Number(state.meta.liveTechnique?.points?.[slot.voteIndex]);
    return Number.isFinite(point) ? point : null;
  });
}

function calculateTechniqueScore(points) {
  const values = (points || []).map(Number).filter((point) => Number.isFinite(point));
  if (!values.length) return null;
  return roundScore(values.reduce((sum, point) => sum + point, 0) / values.length);
}

function shouldUseTechnique(athlete) {
  if (isIwfMode()) return false;
  return Boolean(state.meta.childTechniqueEnabled) && Boolean(getCategory(athlete?.gender).usesTechnique);
}

function shouldShowTechniqueColumn(athletes = state.athletes) {
  return Boolean(state.meta.childTechniqueEnabled) && athletes.some((athlete) => shouldUseTechnique(athlete));
}

function countAttempts(athletes = state.athletes) {
  return athletes.reduce(
    (sum, athlete) => sum + athlete.attempts.snatch.length + athlete.attempts.cleanJerk.length,
    0,
  );
}

function syncPhase() {
  if (state.meta.mode !== "competition") return;

  if (!state.meta.activeGroupId) {
    state.meta.activeGroupId = firstPendingGroupId();
  }

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

  const activeGroup = getActiveGroup();
  markGroupLiftComplete(activeGroup, lift);
  state.meta.breakPending = false;

  if (lift === "snatch") {
    state.meta.mode = "groupComplete";
    return;
  }

  state.meta.mode = firstPendingGroupId() ? "groupComplete" : "finished";
}

function rebuildNextWeight(athlete, lift) {
  const attempts = athlete.attempts[lift];
  if (!attempts.length) {
    athlete.next[lift] = athlete.openers[lift];
    return;
  }
  const last = attempts[attempts.length - 1];
  athlete.next[lift] = last.good ? last.requestedWeight + 1 : last.requestedWeight;
}

function validateStartList() {
  const presentAthletes = state.athletes.filter((athlete) => !athlete.withdrawn);
  if (!presentAthletes.length) return "Bitte zuerst mindestens einen Athleten erfassen.";
  if (!getOrderedGroups().length) return "Bitte zuerst mindestens eine Gruppe anlegen.";

  const groupIds = new Set(state.groups.map((group) => group.id));
  for (const athlete of presentAthletes) {
    if (!athlete.name || !athlete.ageClass || !athlete.weightClass) return "Die Meldedaten sind noch unvollständig.";
    if (normalizeAgeClass(athlete.ageClass) === "masters" && !parseOptionalBirthYear(athlete.birthYear)) {
      return `Für ${athlete.name} fehlt der Jahrgang für den Masters-Altersfaktor.`;
    }
    if (!athlete.bodyweight || !athlete.openers?.snatch || !athlete.openers?.cleanJerk) {
      return `Für ${athlete.name} fehlen Waagewerte oder Anfangsgewichte.`;
    }
    if (isIwfMode()) {
      const warning = iwfAthleteStartWarning(athlete);
      if (warning) return `${athlete.name}: ${warning}`;
    }
    if (!groupIds.has(getAthleteGroupId(athlete))) return `${athlete.name} ist keiner gültigen Gruppe zugeordnet.`;
  }

  if (!getOrderedGroups().some((group) => athletesForGroup(group.id).some((athlete) => !athlete.withdrawn))) {
    return "Mindestens eine Gruppe braucht Athleten.";
  }

  return "";
}

function findAthlete(id) {
  return state.athletes.find((athlete) => athlete.id === id);
}

function sortAthletes() {
  const orderByGroup = new Map(getOrderedGroups().map((group, index) => [group.id, index]));
  state.athletes.sort((a, b) => {
    const groupDiff =
      (orderByGroup.get(getAthleteGroupId(a)) ?? 999) - (orderByGroup.get(getAthleteGroupId(b)) ?? 999);
    if (groupDiff !== 0) return groupDiff;
    return a.startNo - b.startNo;
  });
}

function getOrderedGroups() {
  return [...(state.groups || [])].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return String(a.name).localeCompare(String(b.name), "de-DE", { numeric: true });
  });
}

function sortGroups() {
  state.groups.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return String(a.name).localeCompare(String(b.name), "de-DE", { numeric: true });
  });
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

function nextGroupOrder() {
  return getOrderedGroups().reduce((max, group) => Math.max(max, group.order || 0), 0) + 1;
}

function moveGroup(id, direction) {
  const groups = getOrderedGroups();
  const index = groups.findIndex((group) => group.id === id);
  if (index < 0) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= groups.length) return;
  const [group] = groups.splice(index, 1);
  groups.splice(targetIndex, 0, group);
  groups.forEach((item, itemIndex) => {
    item.order = itemIndex + 1;
  });
  state.groups = groups;
  saveState();
  render();
}

function updateGroupField(input) {
  const group = state.groups.find((item) => item.id === input.dataset.id);
  if (!group) return;
  const value = input.value.trim();
  group.name = value || "Gruppe";
  saveState();
  renderGroupSelect();
}

function getTeams() {
  if (!Array.isArray(state.teams)) state.teams = [];
  return state.teams;
}

function getTeam(id) {
  return getTeams().find((team) => team.id === id) || null;
}

function athletesForTeam(id) {
  return state.athletes.filter((athlete) => athlete.teamId === id);
}

function teamNameById(id) {
  const team = getTeam(id);
  return team?.name || "-";
}

function teamMaxScorers(team) {
  return clampScorerCount(parseInteger(team?.maxScorers) || 6);
}

function clampScorerCount(value) {
  const number = parseInteger(value) || 6;
  return Math.min(Math.max(number, 1), 10);
}

function updateTeamField(input, options = { save: true }) {
  const team = getTeam(input.dataset.id);
  if (!team) return;
  const field = input.dataset.teamField;
  if (field === "name") team.name = input.value;
  if (field === "maxScorers") team.maxScorers = clampScorerCount(input.value);
  if (options.save) {
    team.name = team.name.trim() || "Mannschaft";
    team.maxScorers = teamMaxScorers(team);
    saveState();
    renderTeamSelect();
    renderTeams();
    renderTeamStandings();
  }
}

function normalizeAgeClass(value) {
  const key = String(value || "").trim();
  return AGE_CLASSES.some((ageClass) => ageClass.key === key) ? key : "senior";
}

function ageClassLabel(value) {
  const ageClass = AGE_CLASSES.find((item) => item.key === normalizeAgeClass(value));
  return ageClass?.label || "Frauen/Männer ab 18 Jahre";
}

function weightTypeForAgeClass(value) {
  const ageClass = AGE_CLASSES.find((item) => item.key === normalizeAgeClass(value));
  return ageClass?.weightType || "senior";
}

function getWeightClassOptions(gender, ageClass, categories = state?.categories || DEFAULT_CATEGORIES) {
  const category = getCategory(gender, categories);
  const weightClassType = category.weightClassType || "male";
  const weightType = weightClassType === "child" ? "child" : weightTypeForAgeClass(ageClass);
  if (weightType === "child") return WEIGHT_CLASSES.child.child;
  const genderKey = weightClassType === "female" ? "female" : "male";
  return WEIGHT_CLASSES[weightType]?.[genderKey] || WEIGHT_CLASSES.senior[genderKey];
}

function defaultWeightClassForSelection() {
  return getWeightClassOptions(els.athleteGender?.value, els.athleteAgeClass?.value)[0] || "";
}

function formatWeightClass(value) {
  if (!value) return "-";
  const text = String(value);
  return text.startsWith("+") ? `${text} kg` : `-${text} kg`;
}

function formatMaybeKg(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "-";
  return `${formatScore(number)} kg`;
}

function createDefaultPlates() {
  return DEFAULT_PLATES.map((plate) => ({ ...plate }));
}

function createDefaultCategories() {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
}

function getCategories() {
  if (!Array.isArray(state.categories) || !state.categories.length) state.categories = createDefaultCategories();
  return state.categories;
}

function normalizeCategories(input) {
  const rows = Array.isArray(input) ? input : createDefaultCategories();
  const seen = new Set();
  const normalized = rows
    .map((category, index) => {
      const fallback = DEFAULT_CATEGORIES[index] || DEFAULT_CATEGORIES[0];
      const rawId = String(category.id || slugify(category.label || fallback.label) || `category-${index + 1}`);
      const id = uniqueCategoryId(rawId, seen);
      const weightClassType = ["male", "female", "child"].includes(category.weightClassType)
        ? category.weightClassType
        : fallback.weightClassType;
      const relativeKey = Object.keys(GENDERS).includes(category.relativeKey) ? category.relativeKey : fallback.relativeKey;
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
  return normalized.length ? normalized : createDefaultCategories();
}

function uniqueCategoryId(rawId, seen) {
  const base = slugify(rawId) || "category";
  let id = base;
  let counter = 2;
  while (seen.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  seen.add(id);
  return id;
}

function getCategory(value, categories = getCategories()) {
  const id = normalizeGender(value, categories);
  return categories.find((category) => category.id === id) || categories[0] || DEFAULT_CATEGORIES[0];
}

function defaultCategoryId() {
  return getCategories()[0]?.id || "male";
}

function openCategorySettings() {
  activeSetupView = "categories";
  renderCategorySettings();
  renderSetupViews();
}

function closeCategorySettings() {
  state.categories = normalizeCategories(state.categories);
  saveState();
  render();
}

function addCategoryRow() {
  getCategories().push({
    id: createId(),
    label: "Neue Kategorie",
    barWeight: 20,
    weightClassType: "male",
    relativeKey: "male",
    usesTechnique: false,
    includeCollars: true,
  });
  saveState();
  renderCategorySettings();
  renderCategorySelect();
}

function deleteCategoryRow(id) {
  const categories = getCategories();
  if (categories.length <= 1) {
    showToast("Mindestens eine Kategorie wird benötigt.");
    return;
  }
  if (state.athletes.some((athlete) => athlete.gender === id)) {
    showToast("Diese Kategorie ist noch Athleten zugeordnet.");
    return;
  }
  state.categories = categories.filter((category) => category.id !== id);
  saveState();
  renderCategorySettings();
  renderCategorySelect();
  renderWeightClassSelect();
}

function resetCategories() {
  if (state.athletes.length && !window.confirm("Standard-Kategorien laden? Zugeordnete Athleten werden bei Bedarf auf die erste Kategorie gesetzt.")) {
    return;
  }
  state.categories = createDefaultCategories();
  state.athletes.forEach((athlete) => {
    athlete.gender = normalizeGender(athlete.gender);
    athlete.barWeight = barWeightForGender(athlete.gender);
    const options = getWeightClassOptions(athlete.gender, athlete.ageClass);
    if (!options.includes(athlete.weightClass)) athlete.weightClass = options[0] || "";
  });
  saveState();
  renderCategorySettings();
  render();
}

function updateCategoryField(input, options = { save: true }) {
  const category = getCategories().find((item) => item.id === input.dataset.id);
  if (!category) return;
  const field = input.dataset.categoryField;
  if (field === "label") category.label = input.value;
  if (field === "barWeight") category.barWeight = parseFloatSafe(input.value) || 1;
  if (field === "weightClassType") category.weightClassType = input.value;
  if (field === "relativeKey") category.relativeKey = input.value;
  if (field === "usesTechnique") category.usesTechnique = Boolean(input.checked);
  if (field === "includeCollars") category.includeCollars = Boolean(input.checked);
  state.athletes
    .filter((athlete) => athlete.gender === category.id)
    .forEach((athlete) => {
      athlete.barWeight = category.barWeight;
      const options = getWeightClassOptions(category.id, athlete.ageClass);
      if (!options.includes(athlete.weightClass)) athlete.weightClass = options[0] || "";
    });
  if (options.save) {
    category.label = category.label.trim() || "Kategorie";
    saveState();
    renderCategorySelect();
    renderWeightClassSelect();
  }
}

function renderCategorySettings() {
  if (!els.categoryTableBody) return;
  els.categoryTableBody.innerHTML = getCategories()
    .map((category) => {
      const used = state.athletes.some((athlete) => athlete.gender === category.id);
      return `
        <tr>
          <td><input class="compact-input" type="text" value="${escapeHtml(category.label)}" data-category-field="label" data-id="${category.id}" aria-label="Kategoriebezeichnung" /></td>
          <td><input class="compact-input small-number" type="number" min="1" step="0.5" value="${category.barWeight}" data-category-field="barWeight" data-id="${category.id}" aria-label="Stangengewicht" /></td>
          <td>
            <select data-category-field="weightClassType" data-id="${category.id}" aria-label="Gewichtsklassen-Typ">
              ${renderSelectOption("male", "Männer", category.weightClassType)}
              ${renderSelectOption("female", "Frauen", category.weightClassType)}
              ${renderSelectOption("child", "Kinder", category.weightClassType)}
            </select>
          </td>
          <td>
            <select data-category-field="relativeKey" data-id="${category.id}" aria-label="Relativtabelle">
              ${renderSelectOption("male", "Mann", category.relativeKey)}
              ${renderSelectOption("female", "Frau", category.relativeKey)}
              ${renderSelectOption("child", "Kind", category.relativeKey)}
            </select>
          </td>
          <td>
            <label class="inline-check">
              <input type="checkbox" ${category.usesTechnique ? "checked" : ""} data-category-field="usesTechnique" data-id="${category.id}" />
              Technik
            </label>
          </td>
          <td>
            <label class="inline-check">
              <input type="checkbox" ${category.includeCollars ? "checked" : ""} data-category-field="includeCollars" data-id="${category.id}" />
              2,5 kg je Seite
            </label>
          </td>
          <td>
            ${
              used
                ? `<span class="muted">zugeordnet</span>`
                : `<button type="button" class="mini-button" data-action="delete-category-row" data-id="${category.id}">Entfernen</button>`
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderSelectOption(value, label, selected) {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function getPlates() {
  if (!Array.isArray(state.plates) || !state.plates.length) state.plates = createDefaultPlates();
  return state.plates;
}

function normalizePlates(input) {
  const rows = Array.isArray(input) ? input : createDefaultPlates();
  const shouldMigrateDefaults = rows.some((plate) => plate.id === "plate-1-25" || Number(plate.weight) === 1.25);
  let normalized = rows
    .map((plate, index) => ({
      id: String(plate.id || `plate-${index + 1}-${Date.now()}`),
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
  return normalized.length ? normalized : createDefaultPlates();
}

function normalizePlateColor(value) {
  const text = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text;
  return "#8d98a3";
}

function openPlateSettings() {
  activeSetupView = "plates";
  renderPlateSettings();
  renderSetupViews();
}

function closePlateSettings() {
  state.plates = normalizePlates(state.plates);
  saveState();
  render();
}

function addPlateRow() {
  getPlates().push({ id: createId(), weight: 1, color: "#8d98a3", size: 90 });
  saveState();
  renderPlateSettings();
}

function deletePlateRow(id) {
  if (getPlates().length <= 1) {
    showToast("Mindestens eine Scheibe wird benötigt.");
    return;
  }
  state.plates = getPlates().filter((plate) => plate.id !== id);
  saveState();
  renderPlateSettings();
}

function resetPlates() {
  state.plates = createDefaultPlates();
  saveState();
  renderPlateSettings();
}

function updatePlateField(input, options = { save: true }) {
  const plate = getPlates().find((item) => item.id === input.dataset.id);
  if (!plate) return;
  const field = input.dataset.plateField;
  if (field === "weight") plate.weight = parseFloatSafe(input.value) || 0;
  if (field === "size") plate.size = parseInteger(input.value) || 0;
  if (field === "color") plate.color = input.value || "#8d98a3";
  if (options.save) {
    state.plates = normalizePlates(state.plates);
    saveState();
    renderPlateSettings();
  }
}

function renderPlateSettings() {
  if (!els.platesTableBody) return;
  els.platesTableBody.innerHTML = getPlates()
    .map(
      (plate) => `
        <tr>
          <td><input class="compact-input" type="number" min="0.25" step="0.25" value="${plate.weight}" data-plate-field="weight" data-id="${plate.id}" aria-label="Scheibengewicht" /></td>
          <td><input class="color-input" type="color" value="${escapeHtml(normalizePlateColor(plate.color))}" data-plate-field="color" data-id="${plate.id}" aria-label="Scheibenfarbe" /></td>
          <td><input class="compact-input" type="number" min="40" max="280" step="1" value="${plate.size}" data-plate-field="size" data-id="${plate.id}" aria-label="Scheibengröße" /></td>
          <td><button type="button" class="mini-button" data-action="delete-plate-row" data-id="${plate.id}">Entfernen</button></td>
        </tr>
      `,
    )
    .join("");
}

function createDefaultRelativeTables() {
  const fromValues = (values) =>
    values.split(",").map((value, index) => ({
      bodyweight: RELATIVE_TABLE_START_WEIGHT + index,
      deduction: Number(value),
    }));
  const child = Array.from({ length: 130 }, (_, index) => {
    const bodyweight = RELATIVE_TABLE_START_WEIGHT + index;
    return { bodyweight, deduction: bodyweight };
  });
  return {
    male: fromValues(DEFAULT_RELATIVE_VALUES.male),
    female: fromValues(DEFAULT_RELATIVE_VALUES.female),
    child,
  };
}

function getRelativeTable(gender = relativeTableGender) {
  const key = gender in GENDERS ? gender : "male";
  if (!state.relativeTables) state.relativeTables = createDefaultRelativeTables();
  if (!Array.isArray(state.relativeTables[key])) {
    state.relativeTables[key] = createDefaultRelativeTables()[key] || [];
  }
  return state.relativeTables[key];
}

function sortRelativeTable(gender = relativeTableGender) {
  getRelativeTable(gender).sort((a, b) => a.bodyweight - b.bodyweight);
}

function openRelativeTable() {
  activeSetupView = "relative";
  relativeTableGender = "male";
  renderRelativeTable();
  renderSetupViews();
}

function closeRelativeTable() {
  saveState();
  renderStandings();
}

function setRelativeGender(gender) {
  relativeTableGender = gender in GENDERS ? gender : "male";
  renderRelativeTable();
}

function addRelativeRow() {
  const table = getRelativeTable(relativeTableGender);
  const last = table[table.length - 1] || { bodyweight: 30, deduction: 0 };
  table.push({ bodyweight: Number(last.bodyweight) + 1, deduction: Number(last.deduction) || 0 });
  sortRelativeTable(relativeTableGender);
  saveState();
  renderRelativeTable();
}

function deleteRelativeRow(index) {
  const table = getRelativeTable(relativeTableGender);
  if (table.length <= 1) {
    showToast("Mindestens eine Zeile wird benötigt.");
    return;
  }
  table.splice(index, 1);
  saveState();
  renderRelativeTable();
}

function resetRelativeTable() {
  state.relativeTables[relativeTableGender] = createDefaultRelativeTables()[relativeTableGender];
  saveState();
  renderRelativeTable();
}

function renderRelativeTable() {
  if (!els.relativeTableBody) return;
  document.querySelectorAll("[data-action='set-relative-gender']").forEach((button) => {
    button.classList.toggle("active", button.dataset.gender === relativeTableGender);
  });
  els.relativeTableBody.innerHTML = getRelativeTable(relativeTableGender)
    .map(
      (row, index) => `
        <tr>
          <td>
            <input class="compact-input" type="number" min="0" step="0.01" value="${row.bodyweight}" data-relative-field="bodyweight" data-index="${index}" aria-label="Körpergewicht" />
          </td>
          <td>
            <input class="compact-input" type="number" min="0" step="0.1" value="${row.deduction}" data-relative-field="deduction" data-index="${index}" aria-label="Relativabzug" />
          </td>
          <td>
            <button type="button" class="mini-button" data-action="delete-relative-row" data-index="${index}">Entfernen</button>
          </td>
        </tr>
      `,
    )
    .join("");
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

function getAgeFactorTable(gender = ageFactorGender) {
  const key = gender === "female" ? "female" : "male";
  if (!state.ageFactors) state.ageFactors = createDefaultAgeFactors();
  if (!Array.isArray(state.ageFactors[key])) {
    state.ageFactors[key] = createDefaultAgeFactors()[key] || [];
  }
  return state.ageFactors[key];
}

function sortAgeFactorTable(gender = ageFactorGender) {
  getAgeFactorTable(gender).sort((a, b) => a.age - b.age);
}

function setAgeFactorGender(gender) {
  ageFactorGender = gender === "female" ? "female" : "male";
  renderAgeFactorTable();
}

function addAgeFactorRow() {
  const table = getAgeFactorTable(ageFactorGender);
  const last = table[table.length - 1] || { age: AGE_FACTOR_START_AGE - 1, factor: 1 };
  table.push({ age: Number(last.age) + 1, factor: Number(last.factor) || 1 });
  sortAgeFactorTable(ageFactorGender);
  saveState();
  renderAgeFactorTable();
}

function deleteAgeFactorRow(index) {
  const table = getAgeFactorTable(ageFactorGender);
  if (table.length <= 1) {
    showToast("Mindestens eine Zeile wird benötigt.");
    return;
  }
  table.splice(index, 1);
  saveState();
  renderAgeFactorTable();
}

function resetAgeFactorTable() {
  state.ageFactors = state.ageFactors || createDefaultAgeFactors();
  state.ageFactors[ageFactorGender] = createDefaultAgeFactors()[ageFactorGender];
  saveState();
  renderAgeFactorTable();
}

function updateAgeFactorField(input, options = { save: true }) {
  const index = Number(input.dataset.index);
  const field = input.dataset.ageFactorField;
  const table = getAgeFactorTable(ageFactorGender);
  if (!table[index]) return;
  if (field === "age") table[index].age = parseInteger(input.value) || 0;
  if (field === "factor") table[index].factor = parseFloatSafe(input.value) || 1;
  if (options.save) {
    sortAgeFactorTable(ageFactorGender);
    saveState();
    renderAgeFactorTable();
    renderStandings();
  }
}

function renderAgeFactorTable() {
  if (!els.ageFactorTableBody) return;
  document.querySelectorAll("[data-action='set-age-factor-gender']").forEach((button) => {
    button.classList.toggle("active", button.dataset.gender === ageFactorGender);
  });
  els.ageFactorTableBody.innerHTML = getAgeFactorTable(ageFactorGender)
    .map(
      (row, index) => `
        <tr>
          <td>
            <input class="compact-input" type="number" min="0" step="1" value="${row.age}" data-age-factor-field="age" data-index="${index}" aria-label="Alter" />
          </td>
          <td>
            <input class="compact-input" type="number" min="0" step="0.001" value="${row.factor}" data-age-factor-field="factor" data-index="${index}" aria-label="Altersfaktor" />
          </td>
          <td>
            <button type="button" class="mini-button" data-action="delete-age-factor-row" data-index="${index}">Entfernen</button>
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderAthleteBarHint() {
  if (!els.athleteGender) return;
  const barWeight = barWeightForGender(els.athleteGender.value);
  els.athleteGender.title = `Stangengewicht: ${barWeight} kg`;
}

function getAthleteGroupId(athlete) {
  return athlete?.groupId || getOrderedGroups()[0]?.id || "group-a";
}

function athletesForGroup(groupId) {
  const id = groupId || getOrderedGroups()[0]?.id || null;
  if (!id) return [];
  return state.athletes.filter((athlete) => getAthleteGroupId(athlete) === id);
}

function groupNameById(id) {
  const group = state.groups.find((item) => item.id === id) || getOrderedGroups()[0];
  return group?.name || "-";
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

function getActiveGroup() {
  return state.groups.find((group) => group.id === state.meta.activeGroupId) || null;
}

function getDisplayAthletes() {
  if (state.meta.mode === "competition" || state.meta.mode === "groupComplete") {
    return athletesForGroup(state.meta.activeGroupId).filter((athlete) => !athlete.withdrawn);
  }
  return state.athletes.filter((athlete) => !athlete.withdrawn);
}

function getRefereeCount() {
  return parseRefereeCount(state.meta.refereeCount);
}

function parseRefereeCount(value) {
  return Number(value) === 1 ? 1 : 3;
}

function getRefereeSlots() {
  return getRefereeCount() === 1 ? SOLO_REFEREE_SLOTS : THREE_REFEREE_SLOTS;
}

function getRequiredGoodVotes() {
  return getRefereeCount() === 1 ? 1 : 2;
}

function nextStartNumber() {
  return state.athletes.reduce((max, athlete) => Math.max(max, athlete.startNo || 0), 0) + 1;
}

function normalizeGender(value, categories = state?.categories || DEFAULT_CATEGORIES) {
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

function genderLabel(value) {
  return getCategory(value).label;
}

function barWeightForGender(value) {
  return getCategory(value).barWeight;
}

function barWeightForAthlete(athlete) {
  return parseFloatSafe(athlete?.barWeight) || barWeightForGender(athlete?.gender);
}

function relativeKeyForAthlete(athlete) {
  return getCategory(athlete?.gender).relativeKey;
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `athlete-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseInteger(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

function parseFloatSafe(value) {
  if (value === "" || value === null || value === undefined) return null;
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatBodyweight(value) {
  return value ? `${Number(value).toFixed(2)} kg` : "-";
}

function formatScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("de-DE", { minimumFractionDigits: number % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 });
}

function formatFactor(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("de-DE", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function roundScore(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function formatTechniqueSummary(current, slots = getRefereeSlots()) {
  const points = getActiveTechniquePoints(current, slots).filter((point) => point !== null);
  if (!points.length) return "offen";
  return `${formatScore(calculateTechniqueScore(points))} P`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 2800);
}

function exportData() {
  const filename = `${slugify(state.meta.eventName || "gewichtheben-wettkampf")}.json`;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function openBackupDialog() {
  if (!serverMode) {
    showToast("Automatische Sicherungen sind in der installierten Server-App verfügbar. Nutze sonst Export.");
    return;
  }
  if (els.backupDialog?.showModal) els.backupDialog.showModal();
  await renderBackupList();
}

function closeBackupDialog() {
  if (els.backupDialog?.open) els.backupDialog.close();
}

async function renderBackupList() {
  if (!els.backupList) return;
  els.backupList.innerHTML = `<p class="muted">Sicherungen werden geladen.</p>`;
  try {
    const response = await fetch("/api/backups", { cache: "no-store" });
    if (!response.ok) throw new Error("backups failed");
    const payload = await response.json();
    const backups = Array.isArray(payload.backups) ? payload.backups : [];
    const latest = payload.latest;
    if (!backups.length && !latest) {
      els.backupList.innerHTML = `<p class="muted">Noch keine automatische Sicherung vorhanden.</p>`;
      return;
    }

    const latestRow = latest ? renderBackupRow({ ...latest, isLatest: true }) : "";
    const rows = backups.slice(0, 50).map(renderBackupRow).join("");
    els.backupList.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Zeitpunkt</th>
              <th>Wettkampf</th>
              <th>Stand</th>
              <th>Versuche</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${latestRow}${rows}</tbody>
        </table>
      </div>
    `;
  } catch (error) {
    els.backupList.innerHTML = `<p class="warning-text">Sicherungen konnten nicht geladen werden.</p>`;
  }
}

function renderBackupRow(backup) {
  const eventName = [backup.eventName, backup.category].filter(Boolean).join(" · ") || "Wettkampf";
  const phase = formatBackupPhase(backup);
  return `
    <tr>
      <td><strong>${backup.isLatest ? "Letzte Sicherung" : formatDateTime(backup.createdAt)}</strong></td>
      <td>${escapeHtml(eventName)}<br><span class="muted">${backup.athletes || 0} Athleten</span></td>
      <td>${escapeHtml(phase)}<br><span class="muted">Sequenz ${backup.sequence || 0}</span></td>
      <td>${backup.attempts || 0}</td>
      <td><button type="button" class="mini-button" data-action="restore-backup" data-file="${escapeHtml(backup.file)}">Laden</button></td>
    </tr>
  `;
}

function formatBackupPhase(backup) {
  if (backup.mode === "setup") return "Vorbereitung";
  if (backup.mode === "finished") return "Abgeschlossen";
  if (backup.mode === "groupComplete") return "Gruppenpause";
  const lift = LIFTS[backup.activeLift]?.label || "Wettkampf";
  return [backup.groupName && `Gruppe ${backup.groupName}`, lift].filter(Boolean).join(" · ") || "Wettkampf";
}

async function restoreBackup(file) {
  if (!serverMode || !file) return;
  if (!window.confirm("Diese Sicherung laden und den aktuellen Wettkampfstand ersetzen?")) return;

  try {
    const response = await fetch("/api/backups/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "restore failed");
    state = normalizeState(result.state);
    editingAthleteId = null;
    judgeDraft = state.meta.liveVotes || { key: null, votes: [null, null, null] };
    techniqueDraft = state.meta.liveTechnique || { key: null, points: [null, null, null] };
    plannedNextDraft = { key: null, weight: null };
    closeBackupDialog();
    render();
    showToast("Sicherung wurde geladen.");
  } catch (error) {
    showToast("Sicherung konnte nicht geladen werden.");
  }
}

function generateReport() {
  const filename = `${slugify(state.meta.eventName || "gewichtheben-wettkampf")}-ergebnisliste.html`;
  const blob = new Blob([buildReportHtml()], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Ergebnisliste wurde erstellt.");
}

function generateStartLists() {
  const filename = `${slugify(state.meta.eventName || "gewichtheben-wettkampf")}-starterlisten.html`;
  const blob = new Blob([buildStartListsHtml()], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Starterlisten wurden erstellt.");
}

function generateRegistrationList() {
  const filename = `${slugify(state.meta.eventName || "gewichtheben-wettkampf")}-meldeliste.html`;
  const blob = new Blob([buildRegistrationListHtml()], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Meldeliste wurde erstellt.");
}

function buildRegistrationListHtml() {
  const groupSections = getOrderedGroups()
    .map((group) => {
      const rows = athletesForGroup(group.id)
        .map(
          (athlete, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(athlete.name)}</td>
              <td>${escapeHtml(athlete.team || "-")}</td>
              <td>${escapeHtml(teamNameById(athlete.teamId))}</td>
              <td>${escapeHtml(genderLabel(athlete.gender))}</td>
              <td>${escapeHtml(ageClassLabel(athlete.ageClass))}</td>
              <td>${athlete.birthYear || "-"}</td>
              <td>${escapeHtml(formatWeightClass(athlete.weightClass))}</td>
              <td>${formatMaybeKg(athlete.entryTotal)}</td>
            </tr>
          `,
        )
        .join("");
      return `
        <section>
          <h2>Gruppe ${escapeHtml(group.name)}</h2>
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Verein</th><th>Mannschaft</th><th>Geschlecht</th><th>Altersklasse</th><th>Jahrgang</th><th>Gewichtsklasse</th><th>Gemeldete ZK</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="9">Keine Athleten in dieser Gruppe.</td></tr>`}</tbody>
          </table>
        </section>
      `;
    })
    .join("");
  return buildPrintableListHtml("Meldeliste", groupSections);
}

function buildStartListsHtml() {
  const groupSections = getOrderedGroups()
    .map((group) => {
      const rows = athletesForGroup(group.id)
        .filter((athlete) => !athlete.withdrawn)
        .map(
          (athlete, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(athlete.name)}</td>
              <td>${escapeHtml(athlete.team || "-")}</td>
              <td>${escapeHtml(teamNameById(athlete.teamId))}</td>
              <td>${escapeHtml(genderLabel(athlete.gender))}</td>
              <td>${escapeHtml(ageClassLabel(athlete.ageClass))}</td>
              <td>${escapeHtml(formatWeightClass(athlete.weightClass))}</td>
              <td>${formatMaybeKg(athlete.entryTotal)}</td>
              <td>${formatBodyweight(athlete.bodyweight)}</td>
              <td>${formatMaybeKg(athlete.openers?.snatch)}</td>
              <td>${formatMaybeKg(athlete.openers?.cleanJerk)}</td>
            </tr>
          `,
        )
        .join("");
      return `
        <section>
          <h2>Gruppe ${escapeHtml(group.name)}</h2>
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Verein</th><th>Mannschaft</th><th>Geschlecht</th><th>Altersklasse</th><th>Gewichtsklasse</th><th>Gemeldete ZK</th><th>Körpergewicht</th><th>Start Reißen</th><th>Start Stoßen</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="11">Keine Athleten in dieser Gruppe.</td></tr>`}</tbody>
          </table>
        </section>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")} - Starterlisten</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 28px; color: #1f2933; }
    h1 { margin: 0 0 6px; font-size: 26px; }
    h2 { margin: 26px 0 8px; font-size: 18px; }
    p { margin: 4px 0; color: #52606d; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: avoid; }
    th, td { border: 1px solid #d8dee4; padding: 7px 8px; text-align: left; font-size: 13px; }
    th { background: #f1f5f8; }
    section { page-break-after: always; }
    section:last-child { page-break-after: auto; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")}</h1>
  <p>${escapeHtml(state.meta.category || "Wettkampfklasse offen")} · Plattform ${escapeHtml(state.meta.group || "-")}</p>
  ${groupSections}
</body>
</html>`;
}

function buildPrintableListHtml(title, groupSections) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")} - ${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 28px; color: #1f2933; }
    h1 { margin: 0 0 6px; font-size: 26px; }
    h2 { margin: 26px 0 8px; font-size: 18px; }
    p { margin: 4px 0; color: #52606d; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: avoid; }
    th, td { border: 1px solid #d8dee4; padding: 7px 8px; text-align: left; font-size: 13px; }
    th { background: #f1f5f8; }
    section { page-break-after: always; }
    section:last-child { page-break-after: auto; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")}</h1>
  <p>${escapeHtml(state.meta.category || "Wettkampfklasse offen")} · Plattform ${escapeHtml(state.meta.group || "-")}</p>
  <p><strong>${escapeHtml(title)}</strong></p>
  ${groupSections}
</body>
</html>`;
}

function buildReportHtml() {
  if (isIwfMode()) return buildIwfReportHtml();

  const generatedAt = formatDateTime(new Date().toISOString());
  const judges = state.meta.judgeConnections || {};
  const reportSlots = getRefereeSlots();
  const showAttemptTechnique = shouldShowTechniqueColumn(state.athletes);
  const judgeRows = reportSlots
    .map((slot) => `<tr><td>${slot.label}</td><td>${escapeHtml(judges[slot.key]?.name || "-")}</td></tr>`)
    .join("");
  const judgeHeaders = reportSlots.map((slot) => `<th>${slot.label}</th>`).join("");
  const attemptTechniqueHeader = showAttemptTechnique ? "<th>Technik</th>" : "";
  const attemptColspan = 9 + (showAttemptTechnique ? 1 : 0) + reportSlots.length;

  const startRows = state.athletes
    .map(
      (athlete) => `
        <tr>
          <td>${escapeHtml(athlete.name)}</td>
          <td>${escapeHtml(groupNameById(athlete.groupId))}</td>
          <td>${escapeHtml(genderLabel(athlete.gender))}</td>
          <td>${escapeHtml(ageClassLabel(athlete.ageClass))}</td>
          <td>${escapeHtml(formatWeightClass(athlete.weightClass))}</td>
          <td>${barWeightForAthlete(athlete)} kg</td>
          <td>${escapeHtml(athlete.team || "-")}</td>
          <td>${escapeHtml(teamNameById(athlete.teamId))}</td>
          <td>${formatBodyweight(athlete.bodyweight)}</td>
          <td>${formatMaybeKg(athlete.openers?.snatch)}</td>
          <td>${formatMaybeKg(athlete.openers?.cleanJerk)}</td>
          <td>${formatMaybeKg(athlete.entryTotal)}</td>
        </tr>
      `,
    )
    .join("");

  const awardSection = buildRelativeAwardsHtml(getStandings());
  const teamSection = buildTeamResultsHtml();
  const resultSections = buildGroupResultSections();

  const attemptRows = getAttemptRows()
    .map(
      (row) => `
        <tr>
          <td>${row.sequence}</td>
          <td>${formatDateTime(row.time)}</td>
          <td>${escapeHtml(row.athlete.name)}</td>
          <td>${escapeHtml(groupNameById(row.athlete.groupId))}</td>
          <td>${formatBodyweight(row.athlete.bodyweight)}</td>
          <td>${LIFTS[row.lift].label}</td>
          <td>${row.attemptNo}</td>
          <td>${row.weight} kg</td>
          <td>${row.good ? "Gültig" : "Ungültig"}</td>
          ${
            showAttemptTechnique
              ? `<td>${shouldUseTechnique(row.athlete) && row.techniqueScore !== null && row.techniqueScore !== undefined ? `${formatScore(row.techniqueScore)} P` : "-"}</td>`
              : ""
          }
          ${reportSlots.map((slot, index) => `<td>${formatJudgeVote(row.judges[index])}</td>`).join("")}
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")} - Ergebnisliste</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 28px; color: #1f2933; }
    h1, h2 { margin: 0 0 10px; }
    h1 { font-size: 26px; }
    h2 { margin-top: 28px; font-size: 18px; }
    p { margin: 4px 0; color: #52606d; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #d8dee4; padding: 7px 8px; text-align: left; font-size: 13px; }
    th { background: #f1f5f8; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; margin: 16px 0; }
    .awards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 12px 0 4px; }
    .award-card { border: 1px solid #d8dee4; border-radius: 8px; padding: 12px; background: #f8fafb; }
    .award-card strong { display: block; font-size: 17px; color: #111827; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")}</h1>
  <div class="meta">
    <p><strong>Kategorie:</strong> ${escapeHtml(state.meta.category || "-")}</p>
    <p><strong>Plattform:</strong> ${escapeHtml(state.meta.group || "-")}</p>
    <p><strong>Start:</strong> ${formatDateTime(state.meta.startedAt)}</p>
    <p><strong>Ergebnisliste:</strong> ${generatedAt}</p>
  </div>

  <h2>Kampfrichter</h2>
  <table><thead><tr><th>Position</th><th>Name</th></tr></thead><tbody>${judgeRows}</tbody></table>

  <template>
  <table>
    <thead><tr><th>Name</th><th>Gruppe</th><th>Geschlecht</th><th>Altersklasse</th><th>Gewichtsklasse</th><th>Stange</th><th>Verein</th><th>Mannschaft</th><th>Körpergewicht</th><th>Start Reißen</th><th>Start Stoßen</th><th>Gemeldete ZK</th></tr></thead>
    <tbody>${startRows}</tbody>
  </table>
  </template>

  <h2>Endstand</h2>
  ${awardSection}
  ${teamSection}
  ${resultSections}

  <h2>Versuchsprotokoll</h2>
  <table>
    <thead><tr><th>#</th><th>Uhrzeit</th><th>Name</th><th>Gruppe</th><th>Körpergewicht</th><th>Disziplin</th><th>Versuch</th><th>Gewicht</th><th>Ergebnis</th>${attemptTechniqueHeader}${judgeHeaders}</tr></thead>
    <tbody>${attemptRows || `<tr><td colspan="${attemptColspan}">Keine Versuche eingetragen.</td></tr>`}</tbody>
  </table>
</body>
</html>`;
}

function renderExportHeader(scoringMode = getScoringMode()) {
  if (normalizeScoringMode(scoringMode) === SCORING_MODES.IWF) {
    return `
      <header class="iwf-head">
        ${IWF_REPORT_LOGO}
        <div>
          <h1>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")}</h1>
          <p>${escapeHtml(state.meta.category || "Wettkampfklasse offen")} &middot; Plattform ${escapeHtml(state.meta.group || "-")}</p>
          <p><strong>Regelmodus:</strong> IWF-Regeln aktiv</p>
        </div>
      </header>
      <p class="mode-note">Dieser Wettkampf wurde im IWF-Modus ausgewertet. Die Wertung erfolgt anhand des besten g&uuml;ltigen Rei&szlig;ens, des besten g&uuml;ltigen Sto&szlig;ens und des daraus berechneten Totals.</p>
    `;
  }
  return `<h1>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")}</h1>`;
}

function buildIwfReportHtml() {
  const generatedAt = formatDateTime(new Date().toISOString());
  const judges = state.meta.judgeConnections || {};
  const reportSlots = getRefereeSlots();
  const judgeRows = reportSlots
    .map((slot) => `<tr><td>${slot.label}</td><td>${escapeHtml(judges[slot.key]?.name || "-")}</td></tr>`)
    .join("");
  const judgeHeaders = reportSlots.map((slot) => `<th>${slot.label}</th>`).join("");
  const attemptColspan = 9 + reportSlots.length;

  const athleteRows = state.athletes
    .map((athlete) => {
      const result = calculateIwfAthleteResult(athlete);
      return `
        <tr>
          <td>${escapeHtml(athlete.name)}</td>
          <td>${escapeHtml(groupNameById(athlete.groupId))}</td>
          <td>${escapeHtml(athlete.team || "-")}</td>
          <td>${escapeHtml(teamNameById(athlete.teamId))}</td>
          <td>${escapeHtml(genderLabel(athlete.gender))}</td>
          <td>${escapeHtml(ageClassLabel(athlete.ageClass))}</td>
          <td>${escapeHtml(result.iwfBodyweightCategory)}</td>
          <td>${formatBodyweight(athlete.bodyweight)}</td>
          <td>${formatMaybeKg(athlete.openers?.snatch)}</td>
          <td>${formatMaybeKg(athlete.openers?.cleanJerk)}</td>
        </tr>
      `;
    })
    .join("");

  const attemptRows = getAttemptRows()
    .map(
      (row) => `
        <tr>
          <td>${row.sequence}</td>
          <td>${formatDateTime(row.time)}</td>
          <td>${escapeHtml(row.athlete.name)}</td>
          <td>${escapeHtml(groupNameById(row.athlete.groupId))}</td>
          <td>${formatBodyweight(row.athlete.bodyweight)}</td>
          <td>${LIFTS[row.lift].label}</td>
          <td>${row.attemptNo}</td>
          <td>${row.weight} kg</td>
          <td>${row.good ? "G&uuml;ltig" : "Ung&uuml;ltig"}</td>
          ${reportSlots.map((slot, index) => `<td>${formatJudgeVote(row.judges[index])}</td>`).join("")}
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(state.meta.eventName || "Gewichtheben Wettkampf")} - IWF Ergebnisliste</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 28px; color: #172033; background: #f7f9fc; }
    .iwf-head { display: grid; grid-template-columns: 86px minmax(0, 1fr); gap: 18px; align-items: center; padding: 18px; border-radius: 10px; background: #08111f; color: #eaf1fb; }
    .report-logo-svg { width: 76px; height: 94px; display: block; }
    h1, h2 { margin: 0 0 10px; }
    h1 { font-size: 26px; }
    h2 { margin-top: 28px; font-size: 18px; color: #0f1e35; }
    p { margin: 4px 0; color: #52606d; }
    .iwf-head p { color: #b8c7dc; }
    .mode-note { margin: 16px 0; padding: 12px 14px; border-left: 4px solid #58a6ff; background: #eaf3ff; color: #15324f; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #fff; }
    th, td { border: 1px solid #d8dee4; padding: 7px 8px; text-align: left; font-size: 13px; }
    th { background: #e9eef6; color: #263548; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; margin: 16px 0; }
    .section-break { page-break-inside: avoid; }
    @media print { body { margin: 12mm; background: #fff; } .iwf-head { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  ${renderExportHeader(SCORING_MODES.IWF)}
  <div class="meta">
    <p><strong>Start:</strong> ${formatDateTime(state.meta.startedAt)}</p>
    <p><strong>Ergebnisliste:</strong> ${generatedAt}</p>
  </div>

  <h2>Kampfrichter</h2>
  <table><thead><tr><th>Position</th><th>Name</th></tr></thead><tbody>${judgeRows}</tbody></table>

  <h2>Athletenliste</h2>
  <table>
    <thead><tr><th>Name</th><th>Gruppe</th><th>Verein</th><th>Mannschaft</th><th>Geschlecht</th><th>Altersklasse</th><th>IWF-Gewichtsklasse</th><th>K&ouml;rpergewicht</th><th>Start Rei&szlig;en</th><th>Start Sto&szlig;en</th></tr></thead>
    <tbody>${athleteRows || `<tr><td colspan="10">Keine Athleten erfasst.</td></tr>`}</tbody>
  </table>

  <h2>Endstand</h2>
  ${buildIwfTeamResultsHtml()}
  ${buildIwfGroupResultSections()}

  <h2>Versuchsprotokoll</h2>
  <table>
    <thead><tr><th>#</th><th>Uhrzeit</th><th>Name</th><th>Gruppe</th><th>K&ouml;rpergewicht</th><th>Disziplin</th><th>Versuch</th><th>Gewicht</th><th>Ergebnis</th>${judgeHeaders}</tr></thead>
    <tbody>${attemptRows || `<tr><td colspan="${attemptColspan}">Keine Versuche eingetragen.</td></tr>`}</tbody>
  </table>
</body>
</html>`;
}

function buildIwfTeamResultsHtml() {
  const standings = calculateIwfTeamPoints();
  if (!standings.length) {
    return `
      <section>
        <h2>IWF-Mannschaftswertung</h2>
        <p>Keine Mannschaften mit zugeordneten Athleten vorhanden.</p>
      </section>
    `;
  }

  const rows = standings
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.team.name)}</td>
          <td>${row.snatchPoints}</td>
          <td>${row.cleanJerkPoints}</td>
          <td>${row.totalPoints}</td>
          <td><strong>${row.totalTeamPoints}</strong></td>
          <td>${row.classifiedCount} / ${row.assignedCount}</td>
          <td>${formatIwfTeamAthletes(row)}</td>
          <td>${row.noTotalCount || "-"}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section>
      <h2>IWF-Mannschaftswertung</h2>
      <p>Punkte werden aus den Platzierungen im Rei&szlig;en, Sto&szlig;en und Total addiert: Platz 1 = 28, Platz 2 = 25, Platz 3 = 23, danach 22 bis 1 Punkt bis Platz 25.</p>
      <table>
        <thead><tr><th>Rang</th><th>Mannschaft</th><th>Rei&szlig;en</th><th>Sto&szlig;en</th><th>Total</th><th>Gesamtpunkte</th><th>Gewertete Athleten</th><th>Athleten</th><th>Ohne Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function formatIwfTeamAthletes(row) {
  return (
    row.athleteRows
      .map(
        (item) =>
          `${escapeHtml(item.athlete.name)} (${item.snatchPoints}/${item.cleanJerkPoints}/${item.totalPoints})`,
      )
      .join(", ") || "-"
  );
}

function buildIwfGroupResultSections() {
  const sections = new Map();
  getIwfStandings(state.athletes).forEach((row) => {
    const key = row.classificationKey || "none";
    if (!sections.has(key)) {
      sections.set(key, {
        title: iwfResultSectionTitle(row),
        rows: [],
      });
    }
    sections.get(key).rows.push(row);
  });

  return [...sections.values()]
    .map((section) => {
      const rows = buildIwfResultTableRows(section.rows);
      return `
        <section class="section-break">
          <h2>${escapeHtml(section.title)}</h2>
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Name</th>
                <th>Verein</th>
                <th>Mannschaft</th>
                <th>Geschlecht</th>
                <th>Altersklasse</th>
                <th>IWF-Gewichtsklasse</th>
                <th>K&ouml;rpergewicht</th>
                <th>Rei&szlig;en</th>
                <th>Rang Rei&szlig;en</th>
                <th>Sto&szlig;en</th>
                <th>Rang Sto&szlig;en</th>
                <th>Total / ZK</th>
                <th>Rang Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="15">Keine Athleten in dieser Wertungsklasse.</td></tr>`}</tbody>
          </table>
        </section>
      `;
    })
    .join("");
}

function iwfResultSectionTitle(row) {
  const gender = row.iwfGender === "female" ? "Frauen" : row.iwfGender === "male" ? "Männer" : "Keine IWF-Wertung";
  const ageGroup = iwfAgeGroupLabel(row.athlete?.ageClass);
  return `IWF-Ergebnisliste ${gender} ${ageGroup} ${row.iwfBodyweightCategory || "-"}`;
}

function buildIwfResultTableRows(standings) {
  return standings
    .map(
      (row) => `
        <tr>
          <td>${row.totalRank || "-"}</td>
          <td>${escapeHtml(row.athlete.name)}</td>
          <td>${escapeHtml(row.athlete.team || "-")}</td>
          <td>${escapeHtml(teamNameById(row.athlete.teamId))}</td>
          <td>${escapeHtml(genderLabel(row.athlete.gender))}</td>
          <td>${escapeHtml(ageClassLabel(row.athlete.ageClass))}</td>
          <td>${escapeHtml(row.iwfBodyweightCategory)}</td>
          <td>${formatBodyweight(row.athlete.bodyweight)}</td>
          <td>${row.hasValidSnatch ? row.bestSnatch : "-"}</td>
          <td>${row.snatchRank || "-"}</td>
          <td>${row.hasValidCleanAndJerk ? row.bestCleanAndJerk : "-"}</td>
          <td>${row.cleanJerkRank || "-"}</td>
          <td>${row.hasValidTotal ? row.total : "DNF"}</td>
          <td>${row.totalRank || "-"}</td>
          <td>${formatIwfStatus(row.status)}</td>
        </tr>
      `,
    )
    .join("");
}

function buildTeamResultsHtml() {
  const standings = getTeamStandings();
  if (!standings.length) {
    return `
      <section>
        <h2>Mannschaftswertung</h2>
        <p>Keine Mannschaften mit zugeordneten Athleten vorhanden.</p>
      </section>
    `;
  }

  const rows = standings
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.team.name)}</td>
          <td>${row.scoringCount} / ${row.assignedCount}</td>
          <td>${formatScore(row.score)}</td>
          <td>${escapeHtml(formatTeamScoringNames(row))}</td>
          <td>${row.openCount || "-"}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section>
      <h2>Mannschaftswertung</h2>
      <p>Gewertet werden je Mannschaft die besten hinterlegten Relativleistungen bis zur eingestellten Anzahl, Standard sind sechs Athleten. Ohne Ergebnis bedeutet: zugeordnet, aber noch ohne gültige Zweikampfwertung.</p>
      <table>
        <thead><tr><th>Rang</th><th>Mannschaft</th><th>Wertende</th><th>Relativpunkte</th><th>Gewertet</th><th>Ohne Ergebnis</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function formatTeamScoringNames(row) {
  return row.scoringRows.map((item) => `${item.athlete.name} (${formatScore(item.score)})`).join(", ") || "-";
}

function buildGroupResultSections() {
  return getOrderedGroups()
    .map((group) => {
      const groupAthletes = athletesForGroup(group.id).filter((athlete) => !athlete.withdrawn);
      const standings = getStandings(groupAthletes);
      const showTechnique = shouldShowTechniqueColumn(groupAthletes);
      const showAgeFactor = shouldShowAgeFactorColumn(groupAthletes);
      const rows = buildResultTableRows(standings, showTechnique, showAgeFactor);
      const emptyColspan = 14 + (showTechnique ? 1 : 0) + (showAgeFactor ? 2 : 0);
      return `
        <section class="section-break">
          <h2>Ergebnisliste Gruppe ${escapeHtml(group.name)}</h2>
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Name</th>
                <th>Verein</th>
                <th>Mannschaft</th>
                <th>Geschlecht</th>
                <th>Altersklasse</th>
                <th>Gewichtsklasse</th>
                <th>Körpergewicht</th>
                <th>Reißen</th>
                <th>Stoßen</th>
                <th>ZK</th>
                <th>Relativabzug</th>
                <th>Nach Abzug</th>
                ${showTechnique ? "<th>Technik</th>" : ""}
                ${showAgeFactor ? "<th>Altersfaktor</th><th>Mit Faktor</th>" : ""}
                <th>Gesamtwertung</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="${emptyColspan}">Keine Athleten in dieser Gruppe.</td></tr>`}</tbody>
          </table>
        </section>
      `;
    })
    .join("");
}

function buildResultTableRows(
  standings,
  showTechnique = shouldShowTechniqueColumn(standings.map((row) => row.athlete)),
  showAgeFactor = shouldShowAgeFactorColumn(standings.map((row) => row.athlete)),
) {
  return standings
    .map(
      (row, index) => `
        <tr>
          <td>${row.total ? index + 1 : "-"}</td>
          <td>${escapeHtml(row.athlete.name)}</td>
          <td>${escapeHtml(row.athlete.team || "-")}</td>
          <td>${escapeHtml(teamNameById(row.athlete.teamId))}</td>
          <td>${escapeHtml(genderLabel(row.athlete.gender))}</td>
          <td>${escapeHtml(ageClassLabel(row.athlete.ageClass))}</td>
          <td>${escapeHtml(formatWeightClass(row.athlete.weightClass))}</td>
          <td>${formatBodyweight(row.athlete.bodyweight)}</td>
          <td>${row.snatch || "-"}</td>
          <td>${row.cleanJerk || "-"}</td>
          <td>${row.total || "DNF"}</td>
          <td>${formatScore(row.deduction)}</td>
          <td>${row.total ? formatScore(row.relativeTotal) : "-"}</td>
          ${showTechnique ? `<td>${shouldUseTechnique(row.athlete) ? formatScore(row.technique) : "-"}</td>` : ""}
          ${
            showAgeFactor
              ? `<td>${normalizeAgeClass(row.athlete.ageClass) === "masters" ? formatFactor(row.ageFactor) : "-"}</td><td>${normalizeAgeClass(row.athlete.ageClass) === "masters" && row.total ? formatScore(row.ageAdjustedScore) : "-"}</td>`
              : ""
          }
          <td>${row.total ? formatScore(row.score) : "-"}</td>
        </tr>
      `,
    )
    .join("");
}

function buildRelativeAwardsHtml(standings) {
  const winners = getRelativeAwardWinners(standings);
  return `
    <section>
      <h2>Gruppenübergreifende Relativwertung</h2>
      <div class="awards">
        ${buildRelativeAwardCard("Relativ stärkste Frau", winners.female)}
        ${buildRelativeAwardCard("Relativ stärkster Mann", winners.male)}
      </div>
    </section>
  `;
}

function buildRelativeAwardCard(title, row) {
  if (!row) {
    return `
      <div class="award-card">
        <h3>${escapeHtml(title)}</h3>
        <p>Keine gültige Wertung vorhanden.</p>
      </div>
    `;
  }

  return `
    <div class="award-card">
      <h3>${escapeHtml(title)}</h3>
      <strong>${escapeHtml(row.athlete.name)}</strong>
      <p>${escapeHtml(row.athlete.team || "-")} · Gruppe ${escapeHtml(groupNameById(row.athlete.groupId))}</p>
      <p>ZK ${row.total} kg · Abzug ${formatScore(row.deduction)} · Nach Abzug ${formatScore(row.relativeTotal)}${row.technique ? ` · Gesamt ${formatScore(row.score)}` : ""}</p>
    </div>
  `;
}

function getRelativeAwardWinners(standings = getStandings()) {
  return {
    female: getBestRelativeRow(standings, "female"),
    male: getBestRelativeRow(standings, "male"),
  };
}

function getBestRelativeRow(standings, awardType) {
  return [...standings]
    .filter((row) => row.total && athleteRelativeAwardType(row.athlete) === awardType)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.total !== b.total) return b.total - a.total;
      return a.athlete.name.localeCompare(b.athlete.name, "de-DE");
    })[0] || null;
}

function athleteRelativeAwardType(athlete) {
  const category = getCategory(athlete?.gender);
  if (category.relativeKey === "female" || category.weightClassType === "female") return "female";
  if (category.relativeKey === "male" || category.weightClassType === "male") return "male";
  return null;
}

function getAttemptRows() {
  return state.athletes
    .flatMap((athlete) =>
      Object.keys(LIFTS).flatMap((lift) =>
        athlete.attempts[lift].map((attempt) => ({
          athlete,
          lift,
          attemptNo: attempt.attemptNo,
          weight: attempt.requestedWeight,
          good: attempt.good,
          judges: getAttemptJudgeVotes(attempt),
          techniqueScore: attempt.techniqueScore,
          sequence: attempt.sequence,
          time: attempt.time,
        })),
      ),
    )
    .sort((a, b) => a.sequence - b.sequence);
}

function getAttemptJudgeVotes(attempt) {
  if (Array.isArray(attempt?.judges)) return attempt.judges;
  const counts = getVoteCounts(attempt);
  return [
    ...Array(counts.white).fill(true),
    ...Array(counts.red).fill(false),
    ...Array(Math.max(0, 3 - counts.white - counts.red)).fill(null),
  ].slice(0, 3);
}

function formatJudgeVote(value) {
  if (value === true) return "Weiß";
  if (value === false) return "Rot";
  return "-";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function importData() {
  const file = els.importFile.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(String(reader.result));
      state = normalizeState(imported);
      editingAthleteId = null;
      judgeDraft = { key: null, votes: [null, null, null] };
      techniqueDraft = { key: null, points: [null, null, null] };
      plannedNextDraft = { key: null, weight: null };
      saveState();
      render();
      showToast("Daten importiert.");
    } catch (error) {
      showToast("Die Datei konnte nicht importiert werden.");
    } finally {
      els.importFile.value = "";
    }
  });
  reader.readAsText(file);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : emptyState();
  } catch (error) {
    return emptyState();
  }
}

function loadControlClientToken() {
  try {
    return localStorage.getItem(CONTROL_CLIENT_KEY) || null;
  } catch (error) {
    return null;
  }
}

function saveControlClientToken(token) {
  try {
    localStorage.setItem(CONTROL_CLIENT_KEY, token);
  } catch (error) {
    // A missing token only affects the "this PC" label, not the competition data.
  }
}

function saveState() {
  if (!serverMode) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return;
  }

  const body = JSON.stringify(state);
  serverSaveInFlight += 1;
  serverSaveChain = serverSaveChain
    .catch(() => {})
    .then(() =>
      fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      }).then((response) => {
        if (!response.ok) throw new Error("save failed");
      }),
    )
    .catch(() => {
      showToast("Speichern am lokalen Server ist fehlgeschlagen.");
    })
    .finally(() => {
      serverSaveInFlight = Math.max(0, serverSaveInFlight - 1);
    });
}

function normalizeState(input) {
  const base = emptyState();
  const output = {
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

  output.meta.liveVotes = {
    key: input?.meta?.liveVotes?.key || null,
    votes: Array.isArray(input?.meta?.liveVotes?.votes)
      ? [0, 1, 2].map((index) =>
          typeof input.meta.liveVotes.votes[index] === "boolean" ? input.meta.liveVotes.votes[index] : null,
        )
      : [null, null, null],
  };
  output.meta.liveTechnique = {
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
  output.meta.attemptTimer =
    input?.meta?.attemptTimer && Number(input.meta.attemptTimer.seconds) > 0
      ? {
          startedAt: input.meta.attemptTimer.startedAt || null,
          seconds: parseInteger(input.meta.attemptTimer.seconds) || 60,
          paused: Boolean(input.meta.attemptTimer.paused),
          remaining:
            input.meta.attemptTimer.remaining === null || input.meta.attemptTimer.remaining === undefined
              ? null
              : Math.max(0, parseInteger(input.meta.attemptTimer.remaining) || 0),
          startedBy: ["solo", "center"].includes(input.meta.attemptTimer.startedBy) ? input.meta.attemptTimer.startedBy : null,
          athleteId: input.meta.attemptTimer.athleteId || null,
          key: input.meta.attemptTimer.key || null,
        }
      : null;
  output.meta.judgeConnections = {
    solo: input?.meta?.judgeConnections?.solo || null,
    left: input?.meta?.judgeConnections?.left || null,
    center: input?.meta?.judgeConnections?.center || null,
    right: input?.meta?.judgeConnections?.right || null,
  };
  output.meta.refereeCount = parseRefereeCount(output.meta.refereeCount);
  output.meta.scoringMode = normalizeScoringMode(output.meta.scoringMode);
  if (output.meta.scoringMode === SCORING_MODES.IWF) output.meta.refereeCount = 3;
  output.meta.childTechniqueEnabled = Boolean(output.meta.childTechniqueEnabled);
  output.meta.displayAssignments = normalizeDisplayAssignments(input?.meta?.displayAssignments || {});
  if (output.meta.scoringMode === SCORING_MODES.IWF) output.meta.judgeConnections.solo = null;

  output.groups = ensureAtLeastOneGroup(output.groups)
    .map((group, index) => ({
      id: group.id || createId(),
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

  if (!output.groups.length) output.groups = [{ ...DEFAULT_GROUP }];
  const groupIds = new Set(output.groups.map((group) => group.id));
  const fallbackGroupId = output.groups[0].id;
  const teamIds = new Set(output.teams.map((team) => team.id));

  output.athletes = output.athletes.map((athlete, index) => {
    const openers = {
      snatch: parseInteger(athlete.openers?.snatch) || parseInteger(athlete.snatch),
      cleanJerk:
        parseInteger(athlete.openers?.cleanJerk) ||
        parseInteger(athlete.cleanJerk) ||
        parseInteger(athlete.openers?.cj),
    };
    const gender = normalizeGender(athlete.gender, output.categories);
    const ageClass = normalizeAgeClass(athlete.ageClass);
    const weightOptions = getWeightClassOptions(gender, ageClass, output.categories);
    const weightClass = athlete.weightClass && weightOptions.includes(String(athlete.weightClass))
      ? String(athlete.weightClass)
      : weightOptions[0] || "";

    return {
      id: athlete.id || createId(),
      name: String(athlete.name || `Athlet ${index + 1}`),
      team: String(athlete.team || ""),
      teamId: teamIds.has(athlete.teamId) ? athlete.teamId : "",
      startNo: parseInteger(athlete.startNo) || index + 1,
      groupId: groupIds.has(athlete.groupId) ? athlete.groupId : fallbackGroupId,
      gender,
      ageClass,
      birthYear: parseOptionalBirthYear(athlete.birthYear),
      weightClass,
      barWeight: parseFloatSafe(athlete.barWeight) || getCategory(gender, output.categories).barWeight,
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

  output.meta.sequence = Math.max(
    parseInteger(output.meta.sequence) || 0,
    ...output.athletes.flatMap((athlete) =>
      [...athlete.attempts.snatch, ...athlete.attempts.cleanJerk].map((attempt) => attempt.sequence || 0),
    ),
  );

  if (!groupIds.has(output.meta.activeGroupId)) {
    output.meta.activeGroupId = output.meta.mode === "setup" ? null : fallbackGroupId;
  }

  return output;
}

function normalizeTeams(input) {
  const rows = Array.isArray(input) ? input : [];
  const seen = new Set();
  return rows
    .map((team, index) => {
      const fallbackName = team?.name || `Mannschaft ${index + 1}`;
      const rawId = String(team?.id || slugify(fallbackName) || `team-${index + 1}`);
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
  const base = slugify(rawId) || "team";
  let id = base;
  let counter = 2;
  while (seen.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  seen.add(id);
  return id;
}

function normalizeRelativeTables(input) {
  const defaults = createDefaultRelativeTables();
  const output = {};
  for (const key of Object.keys(GENDERS)) {
    const rows = Array.isArray(input?.[key]) ? input[key] : defaults[key];
    output[key] = rows
      .map((row) => ({
        bodyweight: parseFloatSafe(row.bodyweight),
        deduction: parseFloatSafe(row.deduction),
      }))
      .filter((row) => Number.isFinite(row.bodyweight) && Number.isFinite(row.deduction))
      .sort((a, b) => a.bodyweight - b.bodyweight);
    if (!output[key].length) output[key] = defaults[key];
  }
  return output;
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
  return rows.length >= 50 && rows.some((row) => row.age === AGE_FACTOR_START_AGE) && rows.every((row) => row.factor === 1);
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
  Object.entries(input).forEach(([key, value]) => {
    if (!/^(snatch|cleanJerk):[123]$/.test(key)) return;
    output[key] = Math.min(Math.max(parseInteger(value) || 0, 0), MAX_WAITING_ROOM_CHANGES);
  });
  return output;
}
