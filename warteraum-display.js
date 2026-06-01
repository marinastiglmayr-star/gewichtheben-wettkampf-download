"use strict";

const LIFTS = {
  snatch: { label: "Rei\u00dfen", short: "R" },
  cleanJerk: { label: "Sto\u00dfen", short: "S" },
};

const THREE_REFEREE_SLOTS = [
  { key: "left", label: "Links", voteIndex: 0 },
  { key: "center", label: "Mitte", voteIndex: 1 },
  { key: "right", label: "Rechts", voteIndex: 2 },
];
const SOLO_REFEREE_SLOTS = [{ key: "solo", label: "Kampfrichter", voteIndex: 0 }];
const SCORING_MODES = { CLUB: "CLUB", IWF: "IWF" };
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

let state = null;
let eventSource = null;
let timerInterval = null;
let statePollInterval = null;

const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  startEvents();
  startPolling();
  timerInterval = setInterval(renderTimer, 1000);
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
  if (!state) {
    renderEmpty();
    return;
  }

  applyScoringModeTheme();
  $("#event-title").textContent = state.meta?.eventName || "Gewichtheben";
  $("#event-subtitle").textContent = `${state.meta?.category || "Wettkampf"} \u00b7 Plattform ${state.meta?.group || "-"}`;
  $("#rule-mode").textContent = isIwfMode() ? "IWF-Regeln aktiv" : "Vereinsmodus";

  const logo = $("#event-logo");
  if (logo) {
    logo.src = getActiveLogo();
    logo.alt = isIwfMode() ? "International Weightlifting Federation" : "STC Bavaria 20 Landshut e. V.";
  }

  const queue = getQueue(state.meta?.activeLift);
  const current = queue[0] || null;
  renderCurrentAttempt(current);
  renderNextAthlete(queue);
  renderQueue(queue);
  renderStandings(current);
  renderOvertakeHint(current);
  renderTimer();
}

function renderEmpty() {
  $("#current-athlete").textContent = "Warten auf Verbindung";
  $("#current-meta").textContent = "Noch keine Wettkampfdaten geladen.";
  $("#current-weight").textContent = "-- kg";
  $("#current-time").textContent = "--";
  $("#decision-status").textContent = "offen";
  $("#decision-status").className = "decision open";
  $("#current-call-note").textContent = "Warten auf Wettkampf";
  $("#next-athlete").textContent = "Noch offen";
  $("#next-meta").textContent = "Kein Folgeversuch in der Liste.";
  $("#next-hint").textContent = "Hinweis: warten auf aktuellen Versuch";
  $("#queue-count").textContent = "0 offen";
  $("#queue-body").innerHTML = `<tr><td colspan="6" class="muted">Keine Daten geladen.</td></tr>`;
  $("#standings-head").innerHTML = "";
  $("#standings-body").innerHTML = `<tr><td class="muted">Keine Wertung geladen.</td></tr>`;
  $("#overtake-athlete").textContent = "Taktischer Hinweis";
  $("#overtake-hint").textContent = "Taktischer Hinweis derzeit nicht eindeutig berechenbar.";
  renderTimer();
}

function renderCurrentAttempt(current) {
  if (!current) {
    $("#current-athlete").textContent = state?.meta?.breakPending ? "Pause" : "Warten auf Versuch";
    $("#current-meta").textContent = state?.meta?.mode === "competition"
      ? "Aktuell ist kein offener Versuch vorhanden."
      : "Der Wettkampf ist noch nicht gestartet.";
    $("#current-weight").textContent = "-- kg";
    $("#decision-status").textContent = "offen";
    $("#decision-status").className = "decision open";
    $("#current-call-note").textContent = "Warten auf den naechsten Aufruf.";
    return;
  }

  const decision = getDecisionStatus(current);
  $("#current-athlete").textContent = current.athlete.name || "-";
  $("#current-meta").textContent = `${LIFTS[current.lift].label} \u00b7 Versuch ${current.attemptNo} \u00b7 Gruppe ${groupNameById(current.athlete.groupId)}`;
  $("#current-weight").textContent = `${formatKg(current.weight)} kg`;
  $("#decision-status").textContent = decision.label;
  $("#decision-status").className = `decision ${decision.className}`;
  $("#current-call-note").textContent = timerAllowsRepeat()
    ? "Direkt wieder dran \u00b7 120 s moeglich"
    : "Normaler Aufruf \u00b7 60 s";
}

function renderNextAthlete(queue) {
  const next = queue[1] || null;
  if (!next) {
    $("#next-athlete").textContent = "Noch offen";
    $("#next-meta").textContent = queue.length ? "Nach aktuellem Versuch kein weiterer Versuch in der Liste." : "Kein Folgeversuch in der Liste.";
    $("#next-hint").textContent = "Hinweis: Warteraum beobachtet den naechsten Aufruf.";
    return;
  }

  $("#next-athlete").textContent = next.athlete.name || "-";
  $("#next-meta").textContent = `${LIFTS[next.lift].label} \u00b7 Versuch ${next.attemptNo} \u00b7 ${formatKg(next.weight)} kg`;
  $("#next-hint").textContent = `Hinweis: ${queueHint(next, 1, queue)}`;
}

function renderQueue(queue) {
  const rows = queue.slice(1, 9);
  $("#queue-count").textContent = `${queue.length} offen`;
  if (!rows.length) {
    $("#queue-body").innerHTML = `<tr><td colspan="6" class="muted">Keine weiteren Versuche in der Warteschlange.</td></tr>`;
    return;
  }

  $("#queue-body").innerHTML = rows
    .map((item, index) => {
      const absoluteIndex = index + 1;
      return `
        <tr class="${index === 0 ? "ready-row" : ""}">
          <td>${absoluteIndex}</td>
          <td><strong>${escapeHtml(item.athlete.name || "-")}</strong><br><span class="muted">${escapeHtml(groupNameById(item.athlete.groupId))}</span></td>
          <td>${LIFTS[item.lift].label}</td>
          <td>${item.attemptNo}</td>
          <td class="weight-cell">${formatKg(item.weight)} kg</td>
          <td class="hint-cell">${escapeHtml(queueHint(item, absoluteIndex, queue))}</td>
        </tr>
      `;
    })
    .join("");
}

function renderStandings(current) {
  if (isIwfMode()) {
    renderIwfTacticalStandings(current);
    return;
  }
  renderClubTacticalStandings(current);
}

function renderClubTacticalStandings(current) {
  $("#standings-title").textContent = "Vereinswertung";
  $("#standings-head").innerHTML = `
    <tr>
      <th>Rang</th>
      <th>Athlet</th>
      <th>R</th>
      <th>S</th>
      <th>ZK</th>
      <th>Nach Abzug</th>
      <th>Wertung</th>
    </tr>
  `;
  const rows = getClubStandings(getRelevantAthletes());
  $("#standings-body").innerHTML =
    tacticalRows(rows, current?.athlete?.id)
      .map((row) => `
        <tr class="${row.athlete.id === current?.athlete?.id ? "ready-row" : ""}">
          <td>${row.rank || "-"}</td>
          <td><strong>${escapeHtml(row.athlete.name || "-")}</strong></td>
          <td>${row.snatch || "-"}</td>
          <td>${row.cleanJerk || "-"}</td>
          <td>${row.total || "DNF"}</td>
          <td>${row.total ? formatScore(row.relativeTotal) : "-"}</td>
          <td><strong>${row.total ? formatScore(row.score) : "-"}</strong></td>
        </tr>
      `)
      .join("") || `<tr><td colspan="7" class="muted">Noch keine Vereinswertung.</td></tr>`;
}

function renderIwfTacticalStandings(current) {
  $("#standings-title").textContent = "IWF-Wertung";
  $("#standings-head").innerHTML = `
    <tr>
      <th>Rang</th>
      <th>Athlet</th>
      <th>IWF-Klasse</th>
      <th>R</th>
      <th>S</th>
      <th>Total</th>
      <th>Status</th>
    </tr>
  `;
  const rows = getIwfStandings(getRelevantAthletes());
  $("#standings-body").innerHTML =
    tacticalRows(rows, current?.athlete?.id)
      .map((row) => `
        <tr class="${row.athlete.id === current?.athlete?.id ? "ready-row" : ""}">
          <td>${row.totalRank || "-"}</td>
          <td><strong>${escapeHtml(row.athlete.name || "-")}</strong></td>
          <td>${escapeHtml(row.iwfBodyweightCategory)}</td>
          <td>${row.hasValidSnatch ? row.bestSnatch : "-"}</td>
          <td>${row.hasValidCleanAndJerk ? row.bestCleanAndJerk : "-"}</td>
          <td><strong>${row.hasValidTotal ? row.total : "DNF"}</strong></td>
          <td>${formatIwfStatus(row.status)}</td>
        </tr>
      `)
      .join("") || `<tr><td colspan="7" class="muted">Noch keine IWF-Wertung.</td></tr>`;
}

function renderOvertakeHint(current) {
  const athlete = current?.athlete || getQueue(state?.meta?.activeLift)[1]?.athlete || null;
  if (!athlete) {
    $("#overtake-athlete").textContent = "Taktischer Hinweis";
    $("#overtake-hint").textContent = "Taktischer Hinweis derzeit nicht eindeutig berechenbar.";
    return;
  }

  $("#overtake-athlete").textContent = athlete.name || "Taktischer Hinweis";
  $("#overtake-hint").textContent = isIwfMode() ? getIwfOvertakeHint(athlete) : getClubOvertakeHint(athlete);
}

function tacticalRows(rows, currentAthleteId) {
  const ranked = rows.map((row, index) => ({ ...row, rank: row.rank || index + 1 }));
  const first = ranked.slice(0, 5);
  if (!currentAthleteId || first.some((row) => row.athlete.id === currentAthleteId)) return first;
  const current = ranked.find((row) => row.athlete.id === currentAthleteId);
  return current ? [...first.slice(0, 4), current] : first;
}

function queueHint(item, absoluteIndex, queue) {
  const previous = queue[absoluteIndex - 1] || null;
  const changes = getAttemptChangeCount(item.athlete, item.lift, item.attemptNo);
  const notes = [];
  if (previous?.athlete?.id && previous.athlete.id === item.athlete.id) notes.push("Direkt wieder dran \u00b7 120 s");
  else if (absoluteIndex === 1) notes.push("bereit halten");
  else if (absoluteIndex <= 3) notes.push("vorbereiten");
  else notes.push("im Blick behalten");
  if (changes > 0) notes.push("Gewicht geaendert");
  return notes.join(" \u00b7 ");
}

function renderTimer() {
  const timer = state?.meta?.attemptTimer;
  const headerTarget = $("#attempt-timer");
  const currentTarget = $("#current-time");
  if (!headerTarget || !currentTarget) return;
  if (!timer?.startedBy || !timer?.startedAt || !timer.seconds) {
    headerTarget.textContent = "--";
    currentTarget.textContent = "--";
    headerTarget.classList.remove("warning", "paused");
    currentTarget.classList.remove("time-warning");
    return;
  }

  const remaining = getRemainingSeconds();
  const label = timer.paused ? `${remaining}s Pause` : `${remaining}s`;
  headerTarget.textContent = label;
  currentTarget.textContent = label;
  headerTarget.classList.toggle("warning", remaining <= 10);
  headerTarget.classList.toggle("paused", Boolean(timer.paused));
  currentTarget.classList.toggle("time-warning", remaining <= 10);
}

function getRemainingSeconds() {
  const timer = state?.meta?.attemptTimer;
  if (!timer?.startedBy || !timer?.startedAt || !timer.seconds) return 0;
  if (timer.paused) return Math.max(0, Number(timer.remaining) || 0);
  return Math.max(0, Number(timer.seconds) - Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000));
}

function timerAllowsRepeat() {
  const seconds = parseInteger(state?.meta?.attemptTimer?.seconds);
  return seconds >= 120;
}

function getDecisionStatus(current) {
  const key = attemptKey(current);
  const liveVotes = state?.meta?.liveVotes;
  const slots = getRefereeSlots();
  const votes = liveVotes?.key === key ? liveVotes.votes || [] : [];
  const activeVotes = slots.map((slot) => votes[slot.voteIndex]);
  const openVotes = activeVotes.filter((vote) => vote !== true && vote !== false).length;
  if (openVotes > 0) return { label: "offen", className: "open" };
  const white = activeVotes.filter(Boolean).length;
  const required = slots.length === 1 ? 1 : 2;
  return white >= required
    ? { label: "gueltig", className: "good" }
    : { label: "ungueltig", className: "bad" };
}

function getRefereeSlots() {
  return Number(state?.meta?.refereeCount) === 1 ? SOLO_REFEREE_SLOTS : THREE_REFEREE_SLOTS;
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

function attemptKey(item) {
  return `${item.athlete.id}:${item.lift}:${item.attemptNo}`;
}

function getRelevantAthletes() {
  const groupId = state?.meta?.activeGroupId;
  const athletes = Array.isArray(state?.athletes) ? state.athletes : [];
  const inGroup = groupId ? athletes.filter((athlete) => getAthleteGroupId(athlete) === groupId) : [];
  return inGroup.length ? inGroup : athletes;
}

function getClubStandings(athletes) {
  return (athletes || [])
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
        relativeTotal,
        ageFactor,
        score: ageAdjustedScore,
      };
    })
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.total !== b.total) return b.total - a.total;
      return String(a.athlete.name).localeCompare(String(b.athlete.name), "de-DE");
    })
    .map((row, index) => ({ ...row, rank: row.total ? index + 1 : "-" }));
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
  const results = (athletes || []).map(calculateIwfAthleteResult);
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
    rows.filter((row) => row.hasValidCleanAndJerk).sort(compareIwfCleanAndJerkRows).forEach((row, index) => cleanJerk.set(row.athlete.id, index + 1));
    rows.filter((row) => row.hasValidTotal).sort(compareIwfTotalRows).forEach((row, index) => total.set(row.athlete.id, index + 1));
  }
  return { results, snatch, cleanJerk, total };
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
    classificationKey: iwfClassificationKey(athlete),
    status: !isIwfEligible ? "not-iwf" : hasValidTotal ? "valid-total" : hasAnyRecordedAttempt(athlete) ? "no-total" : "not-started",
  };
}

function getClubOvertakeHint(athlete) {
  const rows = getClubStandings(getRelevantAthletes());
  const index = rows.findIndex((row) => row.athlete.id === athlete.id);
  if (index < 0 || !rows[index]?.total) return "Taktischer Hinweis derzeit nicht eindeutig berechenbar.";
  if (index === 0) return "Aktuell ist in dieser Gruppe kein hoeherer Rang zu ueberholen.";
  const previous = rows[index - 1];
  if (!previous?.total || !Number.isFinite(previous.score) || !Number.isFinite(rows[index].score)) {
    return "Taktischer Hinweis derzeit nicht eindeutig berechenbar.";
  }
  const needed = Math.max(0.1, roundScore(previous.score - rows[index].score + 0.1));
  return `Zum Ueberholen benoetigt: +${formatScore(needed)} Punkte in der Gesamtwertung.`;
}

function getIwfOvertakeHint(athlete) {
  const rows = getIwfStandings(getRelevantAthletes());
  const sameClass = rows.filter((row) => row.classificationKey === iwfClassificationKey(athlete));
  const index = sameClass.findIndex((row) => row.athlete.id === athlete.id);
  if (index < 0) return "Taktischer Hinweis derzeit nicht eindeutig berechenbar.";
  const row = sameClass[index];
  if (!row.hasValidTotal) return "Fuer den Total-Rang braucht der Athlet zuerst ein gueltiges Reissen und Stossen.";
  if (index === 0) return "Aktuell ist in dieser IWF-Klasse kein hoeherer Rang zu ueberholen.";
  const previous = sameClass[index - 1];
  if (!previous?.hasValidTotal) return "Taktischer Hinweis derzeit nicht eindeutig berechenbar.";
  if (previous.total > row.total) return `Zum Ueberholen benoetigt: +${previous.total - row.total + 1} kg im Total.`;
  if (previous.total === row.total) return "Bei gleichem Total zaehlt der frueher erreichte relevante Stossversuch.";
  return "Taktischer Hinweis derzeit nicht eindeutig berechenbar.";
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

function getAgeFactor(athlete) {
  if (normalizeAgeClass(athlete?.ageClass) !== "masters") return 1;
  const birthYear = parseInteger(athlete?.birthYear);
  if (!Number.isInteger(birthYear)) return 1;
  const age = competitionYear() - birthYear;
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

function competitionYear() {
  const today = new Date();
  return Number.isFinite(today.getFullYear()) ? today.getFullYear() : new Date().getFullYear();
}

function getIwfBodyweightCategory(gender, bodyweightKg, ageClass = "senior") {
  if (gender !== "female" && gender !== "male") return "keine IWF-Klasse";
  const ageGroup = iwfAgeGroupKey(ageClass);
  if (!ageGroup) return "keine IWF-Klasse";
  const bodyweight = parseFloatSafe(bodyweightKg);
  if (!Number.isFinite(bodyweight) || bodyweight <= 0) return "-";
  const limits = IWF_BODYWEIGHT_CATEGORIES[ageGroup]?.[gender] || IWF_BODYWEIGHT_CATEGORIES.senior[gender];
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
  if (status === "valid-total") return "G\u00fcltiger Total";
  if (status === "no-total") return "Kein Total";
  if (status === "not-started") return "Nicht angetreten";
  if (status === "not-iwf") return "Keine IWF-Wertung";
  return "-";
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

function getAttemptChangeCount(athlete, lift, attemptNo) {
  const value = athlete?.nextChangeCounts?.[`${lift}:${attemptNo}`];
  return Math.max(0, parseInteger(value) || 0);
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

function normalizeAgeClass(value) {
  const key = String(value || "").trim();
  return ["children", "school", "youth", "junior", "senior", "masters"].includes(key) ? key : "senior";
}

function formatKg(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

function formatScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("de-DE", { minimumFractionDigits: number % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 });
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
