"use strict";

const LIFTS = {
  snatch: { label: "Reißen", short: "R" },
  cleanJerk: { label: "Stoßen", short: "S" },
};

const SCORING_MODES = { CLUB: "CLUB", IWF: "IWF" };
const CLUB_LOGO_SRC = "assets/wappen.png";
const IWF_LOGO_SRC = "assets/iwf-logo.svg";
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
const IWF_PLACEMENT_POINTS = [0, 28, 25, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

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
    if (response.ok) {
      state = await response.json();
      return true;
    }
  } catch (error) {
    state = null;
  }
  return false;
}

function startEvents() {
  if (eventSource) return;
  eventSource = new EventSource("/api/events");
  eventSource.addEventListener("state", (event) => {
    state = JSON.parse(event.data);
    render();
  });
}

function startPolling() {
  if (statePollInterval) return;
  statePollInterval = setInterval(async () => {
    const updated = await loadState();
    if (updated) render();
  }, 1500);
}

function render() {
  if (!state) return;
  applyScoringModeTheme();
  $("#scoreboard-title").textContent = state.meta?.eventName || "Gewichtheben";
  const modeLabel = $("#scoreboard-mode");
  if (modeLabel) {
    modeLabel.textContent = isIwfMode()
      ? "IWF-Regeln aktiv - Wertung nach Reißen, Stoßen und Total"
      : "Vereinsmodus";
  }
  $("#scoreboard-subtitle").textContent = `${state.meta?.category || "Wettkampf"} · Plattform ${state.meta?.group || "-"}`;
  const logo = $("#scoreboard-logo");
  if (logo) {
    logo.src = getActiveLogo();
    logo.alt = isIwfMode() ? "International Weightlifting Federation" : "STC Bavaria 20 Landshut e. V.";
  }
  renderProtocol();
  renderTeams();
  renderStandings();
  renderTimer();
}

function normalizeScoringMode(value) {
  return value === SCORING_MODES.IWF ? SCORING_MODES.IWF : SCORING_MODES.CLUB;
}

function isIwfMode() {
  return normalizeScoringMode(state?.meta?.scoringMode) === SCORING_MODES.IWF;
}

function getActiveLogo() {
  return isIwfMode() ? IWF_LOGO_SRC : CLUB_LOGO_SRC;
}

function applyScoringModeTheme() {
  document.body.classList.toggle("iwf-mode", isIwfMode());
}

function renderProtocol() {
  const rows = getAttemptRows();
  $("#protocol-body").innerHTML =
    rows
      .map(
        (row) => `
          <tr>
            <td>${row.sequence}</td>
            <td>${formatTime(row.time)}</td>
            <td><strong>${escapeHtml(row.athlete.name)}</strong></td>
            <td>${escapeHtml(groupNameById(row.athlete.groupId))}</td>
            <td>${LIFTS[row.lift].label}</td>
            <td>${row.attemptNo}</td>
            <td>${row.weight} kg</td>
            <td class="${row.good ? "ok" : "bad"}">${row.good ? "gültig" : "ungültig"}</td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="8" class="muted">Noch keine Versuche eingetragen.</td></tr>`;
}

function renderTimer() {
  const timer = state?.meta?.attemptTimer;
  const target = $("#scoreboard-timer");
  if (!target) return;
  if (!timer?.startedBy || !timer?.startedAt || !timer.seconds) {
    target.textContent = "--";
    target.classList.remove("warning", "paused");
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

function renderStandings() {
  if (isIwfMode()) {
    renderIwfStandings();
    return;
  }

  const standingsTitle = $("#standings-title");
  if (standingsTitle) standingsTitle.textContent = "Wertung mit Abzug";
  const standings = getStandings(state.athletes || []);
  const showAgeFactor = standings.some((row) => normalizeAgeClass(row.athlete.ageClass) === "masters");
  $("#standings-head").innerHTML = `
    <tr>
      <th>Rang</th>
      <th>Name</th>
      <th>Gruppe</th>
      <th>R</th>
      <th>S</th>
      <th>ZK</th>
      <th>Abzug</th>
      <th>Nach Abzug</th>
      ${showAgeFactor ? "<th>Faktor</th><th>Mit Faktor</th>" : ""}
      <th>Wertung</th>
    </tr>
  `;
  const emptyColspan = 9 + (showAgeFactor ? 2 : 0);
  $("#standings-body").innerHTML =
    standings
      .map(
        (row, index) => `
          <tr>
            <td>${row.total ? index + 1 : "-"}</td>
            <td><strong>${escapeHtml(row.athlete.name)}</strong><br><span class="muted">${escapeHtml(row.athlete.team || "-")} / ${escapeHtml(teamNameById(row.athlete.teamId))}</span></td>
            <td>${escapeHtml(groupNameById(row.athlete.groupId))}</td>
            <td>${row.snatch || "-"}</td>
            <td>${row.cleanJerk || "-"}</td>
            <td>${row.total || "DNF"}</td>
            <td>${formatScore(row.deduction)}</td>
            <td>${row.total ? formatScore(row.relativeTotal) : "-"}</td>
            ${
              showAgeFactor
                ? `<td>${normalizeAgeClass(row.athlete.ageClass) === "masters" ? formatFactor(row.ageFactor) : "-"}</td><td>${normalizeAgeClass(row.athlete.ageClass) === "masters" && row.total ? formatScore(row.ageAdjustedScore) : "-"}</td>`
                : ""
            }
            <td><strong>${row.total ? formatScore(row.score) : "-"}</strong></td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="${emptyColspan}" class="muted">Noch keine Wertung.</td></tr>`;
}

function renderIwfStandings() {
  const standingsTitle = $("#standings-title");
  if (standingsTitle) standingsTitle.textContent = "IWF-Wertung";
  const standings = getIwfStandings(state.athletes || []);
  $("#standings-head").innerHTML = `
    <tr>
      <th>Rang</th>
      <th>Name</th>
      <th>Altersklasse</th>
      <th>IWF-Klasse</th>
      <th>Rei&szlig;en</th>
      <th>Rang R</th>
      <th>Sto&szlig;en</th>
      <th>Rang S</th>
      <th>Total</th>
      <th>Status</th>
    </tr>
  `;
  $("#standings-body").innerHTML =
    standings
      .map(
        (row) => `
          <tr>
            <td>${row.totalRank || "-"}</td>
            <td><strong>${escapeHtml(row.athlete.name)}</strong><br><span class="muted">${escapeHtml(row.athlete.team || "-")} / ${escapeHtml(teamNameById(row.athlete.teamId))}</span></td>
            <td>${escapeHtml(ageClassLabel(row.athlete.ageClass))}</td>
            <td>${escapeHtml(row.iwfBodyweightCategory)}</td>
            <td>${row.hasValidSnatch ? row.bestSnatch : "-"}</td>
            <td>${row.snatchRank || "-"}</td>
            <td>${row.hasValidCleanAndJerk ? row.bestCleanAndJerk : "-"}</td>
            <td>${row.cleanJerkRank || "-"}</td>
            <td><strong>${row.hasValidTotal ? row.total : "DNF"}</strong></td>
            <td>${formatIwfStatus(row.status)}</td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="10" class="muted">Noch keine IWF-Wertung.</td></tr>`;
}

function renderTeams() {
  const target = $("#teams-body");
  if (!target) return;
  if (isIwfMode()) {
    const title = $("#teams-title");
    if (title) title.textContent = "IWF-Mannschaftswertung";
    renderIwfTeams(target);
    return;
  }

  const title = $("#teams-title");
  if (title) title.textContent = "Live-Mannschaftswertung";
  $("#teams-head").innerHTML = `
    <tr>
      <th>Rang</th>
      <th>Mannschaft</th>
      <th>Wertende</th>
      <th>Relativpunkte</th>
      <th>Ohne Ergebnis</th>
    </tr>
  `;
  const standings = getTeamStandings(state.athletes || []);
  target.innerHTML =
    standings
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(row.team.name)}</strong><br><span class="muted">Top ${row.maxScorers}</span></td>
            <td>${row.scoringCount} / ${row.assignedCount}</td>
            <td><strong>${formatScore(row.score)}</strong></td>
            <td>${row.openCount || "-"}</td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="5" class="muted">Noch keine Mannschaftswertung.</td></tr>`;
}

function renderIwfTeams(target) {
  $("#teams-head").innerHTML = `
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
  const standings = calculateIwfTeamPoints(state.athletes || []);
  target.innerHTML =
    standings
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(row.team.name)}</strong><br><span class="muted">${row.classifiedCount} / ${row.assignedCount} mit Total</span></td>
            <td>${row.snatchPoints}</td>
            <td>${row.cleanJerkPoints}</td>
            <td>${row.totalPoints}</td>
            <td><strong>${row.totalTeamPoints}</strong></td>
            <td>${row.noTotalCount || "-"}</td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="7" class="muted">Noch keine IWF-Mannschaftswertung.</td></tr>`;
}

function getStandings(athletes) {
  return athletes
    .filter((athlete) => !athlete.withdrawn)
    .map((athlete) => {
      const snatch = bestWeight(athlete, "snatch");
      const cleanJerk = bestWeight(athlete, "cleanJerk");
      const total = snatch && cleanJerk ? snatch + cleanJerk : 0;
      const deduction = getRelativeDeduction(athlete);
      const technique = getTechniqueTotal(athlete);
      const relativeSnatch = snatch ? roundScore(snatch - deduction) : 0;
      const relativeCleanJerk = cleanJerk ? roundScore(cleanJerk - deduction) : 0;
      const relativeTotal = total ? roundScore(relativeSnatch + relativeCleanJerk) : 0;
      const scoreBeforeAge = total ? roundScore(relativeTotal + technique) : 0;
      const ageFactor = getAgeFactor(athlete);
      const ageAdjustedScore = total ? roundScore(scoreBeforeAge * ageFactor) : 0;
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
        score: ageAdjustedScore,
      };
    })
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.total !== b.total) return b.total - a.total;
      return String(a.athlete.name).localeCompare(String(b.athlete.name), "de-DE");
    });
}

function getTeamStandings(athletes) {
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
        assignedCount: members.length,
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
    status: !isIwfEligible ? "not-iwf" : hasValidTotal ? "valid-total" : hasAnyRecordedAttempt(athlete) ? "no-total" : "not-started",
  };
}

function getIwfStandings(athletes) {
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

function getIwfRankMaps(athletes) {
  const eligibleAthletes = (athletes || []).filter((athlete) => !athlete.withdrawn);
  const results = eligibleAthletes.map(calculateIwfAthleteResult);
  const byClass = new Map();
  for (const row of results) {
    if (!byClass.has(row.classificationKey)) byClass.set(row.classificationKey, []);
    byClass.get(row.classificationKey).push(row);
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

function calculateIwfTeamPoints(athletes) {
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
        assignedCount: members.length,
        classifiedCount: athleteRows.filter((row) => row.hasValidTotal).length,
        noTotalCount: athleteRows.filter((row) => !row.hasValidTotal).length,
        snatchPoints,
        cleanJerkPoints,
        totalPoints,
        totalTeamPoints,
        placementCounts,
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

function compareIwfSnatchRows(a, b) {
  if (a.bestSnatch !== b.bestSnatch) return b.bestSnatch - a.bestSnatch;
  if (a.bestSnatchAttemptOrder !== b.bestSnatchAttemptOrder) return a.bestSnatchAttemptOrder - b.bestSnatchAttemptOrder;
  return iwfFallbackSort(a, b);
}

function compareIwfCleanAndJerkRows(a, b) {
  if (a.bestCleanAndJerk !== b.bestCleanAndJerk) return b.bestCleanAndJerk - a.bestCleanAndJerk;
  if (a.bestCleanAndJerkAttemptOrder !== b.bestCleanAndJerkAttemptOrder) return a.bestCleanAndJerkAttemptOrder - b.bestCleanAndJerkAttemptOrder;
  return iwfFallbackSort(a, b);
}

function compareIwfTotalRows(a, b) {
  if (a.total !== b.total) return b.total - a.total;
  if (a.totalTieBreakAttemptOrder !== b.totalTieBreakAttemptOrder) return a.totalTieBreakAttemptOrder - b.totalTieBreakAttemptOrder;
  return iwfFallbackSort(a, b);
}

function iwfFallbackSort(a, b) {
  return String(a.athlete.name).localeCompare(String(b.athlete.name), "de-DE", { numeric: true });
}

function bestAttempt(athlete, lift) {
  return [...(athlete.attempts?.[lift] || [])]
    .filter((attempt) => attempt.good)
    .sort((a, b) => {
      if (a.requestedWeight !== b.requestedWeight) return b.requestedWeight - a.requestedWeight;
      if (a.attemptNo !== b.attemptNo) return a.attemptNo - b.attemptNo;
      return a.sequence - b.sequence;
    })[0];
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

function formatIwfStatus(status) {
  if (status === "valid-total") return "G&uuml;ltiger Total";
  if (status === "no-total") return "Kein Total";
  if (status === "not-started") return "Nicht angetreten";
  if (status === "not-iwf") return "Keine IWF-Wertung";
  return "-";
}

function getTeams() {
  return Array.isArray(state?.teams) ? state.teams : [];
}

function teamNameById(id) {
  return getTeams().find((team) => team.id === id)?.name || "-";
}

function teamMaxScorers(team) {
  const number = Number(team?.maxScorers);
  return Number.isInteger(number) ? Math.min(Math.max(number, 1), 10) : 6;
}

function bestWeight(athlete, lift) {
  return Math.max(0, ...(athlete.attempts?.[lift] || []).filter((attempt) => attempt.good).map((attempt) => attempt.requestedWeight));
}

function getRelativeDeduction(athlete) {
  const bodyweight = Number(athlete?.bodyweight);
  if (!Number.isFinite(bodyweight) || bodyweight <= 0) return 0;
  const table = getRelativeTable(relativeKeyForAthlete(athlete));
  let match = table[0] || null;
  for (const row of table) {
    if (bodyweight >= row.bodyweight) match = row;
    if (bodyweight < row.bodyweight) break;
  }
  return Number(match?.deduction) || 0;
}

function getRelativeTable(key) {
  const rows = state?.relativeTables?.[key] || [];
  return rows
    .map((row) => ({ bodyweight: Number(row.bodyweight), deduction: Number(row.deduction) }))
    .filter((row) => Number.isFinite(row.bodyweight) && Number.isFinite(row.deduction))
    .sort((a, b) => a.bodyweight - b.bodyweight);
}

function relativeKeyForAthlete(athlete) {
  const category = getCategory(athlete?.gender);
  return category.relativeKey || (category.weightClassType === "female" ? "female" : "male");
}

function getAgeFactor(athlete) {
  if (normalizeAgeClass(athlete?.ageClass) !== "masters") return 1;
  const birthYear = parseInteger(athlete?.birthYear);
  if (!Number.isInteger(birthYear)) return 1;
  const age = athleteAge(athlete);
  if (!Number.isFinite(age)) return 1;
  const key = ageFactorKeyForAthlete(athlete);
  const table = (state?.ageFactors?.[key] || [])
    .map((row) => ({ age: parseInteger(row.age), factor: parseFloatSafe(row.factor) }))
    .filter((row) => Number.isFinite(row.age) && Number.isFinite(row.factor) && row.factor > 0)
    .sort((a, b) => a.age - b.age);
  let match = null;
  for (const row of table) {
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
  const birthYear = parseInteger(athlete?.birthYear);
  if (!Number.isInteger(birthYear)) return null;
  return competitionYear() - birthYear;
}

function competitionYear() {
  const today = new Date();
  return Number.isFinite(today.getFullYear()) ? today.getFullYear() : new Date().getFullYear();
}

function getTechniqueTotal(athlete) {
  if (!shouldUseTechnique(athlete)) return 0;
  return roundScore(bestTechniqueScore(athlete, "snatch") + bestTechniqueScore(athlete, "cleanJerk"));
}

function bestTechniqueScore(athlete, lift) {
  return Math.max(0, ...(athlete.attempts?.[lift] || []).map((attempt) => Number(attempt.techniqueScore)).filter(Number.isFinite));
}

function shouldUseTechnique(athlete) {
  if (isIwfMode()) return false;
  return Boolean(state?.meta?.childTechniqueEnabled) && Boolean(getCategory(athlete?.gender).usesTechnique);
}

function getCategory(value) {
  const rows = Array.isArray(state?.categories) && state.categories.length ? state.categories : [];
  const normalized = String(value || "").trim().toLowerCase();
  return (
    rows.find((category) => String(category.id).toLowerCase() === normalized) ||
    rows.find((category) => String(category.label || "").trim().toLowerCase() === normalized) ||
    rows[0] ||
    {}
  );
}

function normalizeAgeClass(value) {
  const key = String(value || "").trim();
  return ["children", "school", "youth", "junior", "senior", "masters"].includes(key) ? key : "senior";
}

function ageClassLabel(value) {
  const labels = {
    children: "Kinder",
    school: "Schüler/-innen",
    youth: "Jugend",
    junior: "Juniorinnen/Junioren",
    senior: "Frauen/Männer",
    masters: "Masters",
  };
  return labels[normalizeAgeClass(value)] || labels.senior;
}

function getAttemptRows() {
  return (state.athletes || [])
    .flatMap((athlete) =>
      Object.keys(LIFTS).flatMap((lift) =>
        (athlete.attempts?.[lift] || []).map((attempt) => ({
          athlete,
          lift,
          attemptNo: attempt.attemptNo,
          weight: attempt.requestedWeight,
          good: attempt.good,
          sequence: attempt.sequence,
          time: attempt.time,
        })),
      ),
    )
    .sort((a, b) => a.sequence - b.sequence);
}

function groupNameById(id) {
  const group = (state.groups || []).find((item) => item.id === id);
  return group?.name || "-";
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

function parseInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseFloatSafe(value) {
  if (value === "" || value === null || value === undefined) return null;
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundScore(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
