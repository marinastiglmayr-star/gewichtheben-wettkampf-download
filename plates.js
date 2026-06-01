"use strict";

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

const DEFAULT_PLATES = [
  { weight: 25, color: "#c9262d", size: 238 },
  { weight: 20, color: "#1f68b6", size: 238 },
  { weight: 15, color: "#f3c832", size: 212 },
  { weight: 10, color: "#27834a", size: 184 },
  { weight: 5, color: "#f7f8f7", size: 146 },
  { weight: 2.5, color: "#f28c28", size: 112 },
  { weight: 2, color: "#2b78d0", size: 98 },
  { weight: 1, color: "#39a35b", size: 84 },
  { weight: 0.5, color: "#f3d44d", size: 70 },
];

let state = null;
let eventSource = null;
let timerInterval = null;
let statePollInterval = null;

const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  startEvents();
  startPolling();
  render();
});

async function loadState() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (response.ok) state = await response.json();
  } catch (error) {
    state = null;
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
    $("#plate-note").textContent = "Live-Verbindung wird wiederhergestellt.";
  });
}

function startPolling() {
  if (statePollInterval) return;
  statePollInterval = setInterval(async () => {
    await loadState();
    render();
  }, 1500);
}

function render() {
  const iwfMode = state?.meta?.scoringMode === "IWF";
  document.body.classList.toggle("iwf-mode", iwfMode);
  const ruleModeLabel = $("#rule-mode-label");
  if (ruleModeLabel) {
    ruleModeLabel.textContent = iwfMode
      ? "IWF-Regeln aktiv - 3 Kampfrichter, Totalwertung"
      : "Vereinsmodus";
  }
  const current = getCurrentAttempt();
  if (!current) {
    renderEmpty();
    return;
  }

  const barWeight = barWeightForAthlete(current.athlete);
  const collars = includeCollarsForAthlete(current.athlete);
  const loading = calculateLoading(current.weight, barWeight, collars ? 2.5 : 0);
  $("#attempt-title").textContent = `${current.athlete.name} · Gruppe ${groupNameById(current.athlete.groupId)} · ${LIFTS[current.lift].short}${current.attemptNo}`;
  $("#total-weight").textContent = `${formatKg(current.weight)} kg`;
  $("#bar-label").textContent = collars ? `${formatKg(barWeight)} kg Stange + Verschlüsse` : `${formatKg(barWeight)} kg Stange`;

  renderTimer();
  renderJudgeDisplay(current);
  renderStack($("#left-stack"), loading.plates, true, collars);
  renderStack($("#right-stack"), loading.plates, false, collars);
  renderPlateList(loading.plates);

  if (!loading.isLoadable) {
    $("#plate-note").innerHTML = `<span class="warning">Mit den hinterlegten Scheiben bleiben ${formatKg(loading.remainder)} kg pro Seite offen.</span>`;
  } else {
    $("#plate-note").textContent = "Scheiben werden pro Seite von innen nach außen mit möglichst schweren Scheiben gesteckt.";
  }
}

function renderEmpty() {
  $("#attempt-title").textContent = "Warten auf Versuch";
  $("#total-weight").textContent = "-- kg";
  $("#attempt-timer").textContent = "--";
  $("#bar-label").textContent = "Stange";
  $("#left-stack").innerHTML = "";
  $("#right-stack").innerHTML = "";
  $("#plate-list").innerHTML = "";
  $("#judge-display").innerHTML = `<span class="judge-chip muted">Keine Wertung</span>`;
  $("#plate-note").textContent = "Noch kein Versuch aktiv.";
}

function calculateLoading(totalWeight, barWeight, collarPerSide = 0) {
  const perSide = (Number(totalWeight) - Number(barWeight)) / 2 - Number(collarPerSide || 0);
  if (!Number.isFinite(perSide) || perSide < 0) {
    return { perSide: 0, plates: [], remainder: 0, isLoadable: false };
  }

  let remaining = roundToHundredth(perSide);
  const plates = [];
  for (const plate of getConfiguredPlates()) {
    const count = Math.floor((remaining + 0.0001) / plate.weight);
    if (count > 0) {
      plates.push({ ...plate, count });
      remaining = roundToHundredth(remaining - count * plate.weight);
    }
  }

  return {
    perSide,
    plates,
    remainder: Math.max(0, remaining),
    isLoadable: remaining < 0.001,
  };
}

function renderStack(container, plates, reverse, collars = false) {
  const expanded = plates.flatMap((plate) => Array.from({ length: plate.count }, () => plate));
  const ordered = reverse ? [...expanded].reverse() : expanded;
  const plateHtml = ordered
    .map(
      (plate) => `
        <div class="plate" style="height:${plate.size}px;background:${plate.color};color:${textColorForBackground(plate.color)}" title="${formatKg(plate.weight)} kg">
          ${formatKg(plate.weight)}
        </div>
      `,
    )
    .join("");
  const collarHtml = collars ? renderCollar(reverse ? "left" : "right") : "";
  container.innerHTML = reverse ? `${collarHtml}${plateHtml}` : `${plateHtml}${collarHtml}`;
}

function renderCollar(side) {
  const isLeft = side === "left";
  const blockX = isLeft ? 41 : 3;
  const hingeX = isLeft ? blockX + 14 : blockX + 20;
  const leverPath = isLeft
    ? `M${hingeX} 34 C43 29 27 26 8 27`
    : `M${hingeX} 34 C35 29 51 26 70 27`;
  const leverEndX = isLeft ? 8 : 70;

  return `
    <svg class="collar collar-${side}" viewBox="0 0 78 94" role="img" aria-label="Verschluss 2,5 kg">
      <title>Verschluss 2,5 kg</title>
      <defs>
        <linearGradient id="collar-body-${side}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#39a35b" />
          <stop offset="48%" stop-color="#27834a" />
          <stop offset="100%" stop-color="#155d32" />
        </linearGradient>
      </defs>
      <rect class="collar-clamp-shadow" x="${blockX + 3}" y="34" width="34" height="42" rx="8" />
      <rect class="collar-clamp-body" x="${blockX}" y="31" width="34" height="42" rx="8" fill="url(#collar-body-${side})" />
      <path class="collar-clamp-highlight" d="M${blockX + 6} 36 H${blockX + 20} C${blockX + 25} 36 ${blockX + 28} 40 ${blockX + 28} 45 V50 C${blockX + 20} 48 ${blockX + 12} 48 ${blockX + 5} 51 Z" />
      <path class="collar-lever-outline" d="${leverPath}" />
      <path class="collar-lever" d="${leverPath}" />
      <circle class="collar-hinge" cx="${hingeX}" cy="34" r="5" />
      <circle class="collar-lever-end" cx="${leverEndX}" cy="27" r="3.2" />
    </svg>
  `;
}

function renderPlateList(plates) {
  $("#plate-list").innerHTML =
    plates
      .map(
        (plate) => `
          <span class="plate-chip">
            <span class="chip-dot" style="background:${plate.color}"></span>
            ${plate.count} × ${formatKg(plate.weight)} kg
          </span>
        `,
      )
      .join("") || `<span class="plate-chip">Keine Scheiben</span>`;
}

function renderJudgeDisplay(current) {
  const slots = getRefereeSlots();
  const key = attemptKey(current);
  const votes = state?.meta?.liveVotes?.key === key ? state.meta.liveVotes.votes || [] : [];
  const judges = state?.meta?.judgeConnections || {};
  const white = slots.filter((slot) => votes[slot.voteIndex] === true).length;
  const red = slots.filter((slot) => votes[slot.voteIndex] === false).length;
  const open = slots.filter((slot) => votes[slot.voteIndex] === null || votes[slot.voteIndex] === undefined).length;
  const ruleSuffix = state?.meta?.scoringMode === "IWF" ? " &middot; IWF 2/3" : "";
  const decision = open
    ? "Offen"
    : white >= (slots.length === 1 ? 1 : 2)
      ? "Gültig"
      : "Ungültig";

  $("#judge-display").innerHTML = `
    <div class="judge-summary ${open ? "open" : white >= (slots.length === 1 ? 1 : 2) ? "good" : "bad"}">
      <strong>${decision}</strong>
      ${ruleSuffix ? `<span class="iwf-judge-note">IWF-Mehrheit: 2 von 3 wei&szlig;en Stimmen</span>` : ""}
      <span>${white} weiß · ${red} rot · ${open} offen</span>
    </div>
    <div class="judge-chip-grid">
      ${slots
        .map((slot) => {
          const vote = votes[slot.voteIndex];
          const voteText = vote === true ? "Weiß" : vote === false ? "Rot" : "offen";
          const voteClass = vote === true ? "good" : vote === false ? "bad" : "open";
          return `
            <span class="judge-chip ${voteClass}">
              <small>${slot.label}</small>
              <strong>${escapeHtml(judges[slot.key]?.name || "nicht verbunden")}</strong>
              <em>${voteText}</em>
            </span>
          `;
        })
        .join("")}
    </div>
  `;
}

function getRefereeSlots() {
  return Number(state?.meta?.refereeCount) === 1 ? SOLO_REFEREE_SLOTS : THREE_REFEREE_SLOTS;
}

function getConfiguredPlates() {
  const rows = Array.isArray(state?.plates) && state.plates.length ? state.plates : DEFAULT_PLATES;
  return rows
    .map((plate) => ({
      weight: Number(plate.weight),
      color: normalizeColor(plate.color),
      size: Number(plate.size || plate.height || 120),
    }))
    .filter((plate) => Number.isFinite(plate.weight) && plate.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

function normalizeColor(value) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text : "#8d98a3";
}

function textColorForBackground(color) {
  const hex = normalizeColor(color).slice(1);
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.62 ? "#111820" : "#ffffff";
}

function getCurrentAttempt() {
  if (!state || state.meta?.mode !== "competition" || state.meta?.breakPending) return null;
  return getQueue(state.meta.activeLift)[0] || null;
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
  if (!Number.isFinite(weight) || weight < 1) return null;
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

function normalizeGender(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "female" || normalized === "woman" || normalized === "w" || normalized === "frau") return "female";
  if (normalized === "child" || normalized === "kid" || normalized === "kind") return "child";
  return "male";
}

function barWeightForAthlete(athlete) {
  const category = getCategory(athlete?.gender);
  const saved = Number(athlete?.barWeight);
  if (Number.isFinite(saved) && saved > 0) return saved;
  return Number(category?.barWeight) || { male: 20, female: 15, child: 5 }[normalizeGender(athlete?.gender)];
}

function includeCollarsForAthlete(athlete) {
  return Boolean(getCategory(athlete?.gender)?.includeCollars);
}

function getCategory(value) {
  const rows = Array.isArray(state?.categories) && state.categories.length ? state.categories : [];
  const normalized = String(value || "").trim().toLowerCase();
  return (
    rows.find((category) => String(category.id).toLowerCase() === normalized) ||
    rows.find((category) => String(category.label || "").trim().toLowerCase() === normalized) ||
    rows[0] ||
    { id: normalizeGender(value), barWeight: { male: 20, female: 15, child: 5 }[normalizeGender(value)], includeCollars: normalizeGender(value) !== "child" }
  );
}

function renderTimer() {
  const timer = state?.meta?.attemptTimer;
  const target = $("#attempt-timer");
  if (!target) return;
  if (!timer?.startedBy || !timer?.startedAt || !timer.seconds) {
    target.textContent = "--";
    target.classList.remove("warning");
    target.classList.remove("paused");
    return;
  }
  const remaining = timer.paused
    ? Math.max(0, Number(timer.remaining) || 0)
    : Math.max(0, Number(timer.seconds) - Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000));
  target.textContent = timer.paused ? `${remaining}s Pause` : `${remaining}s`;
  target.classList.toggle("warning", remaining <= 10);
  target.classList.toggle("paused", Boolean(timer.paused));
  if (!timerInterval) {
    timerInterval = setInterval(renderTimer, 1000);
  }
}

function roundToHundredth(value) {
  return Math.round(value * 100) / 100;
}

function formatKg(value) {
  return Number(value).toLocaleString("de-DE", {
    minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
