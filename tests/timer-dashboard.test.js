const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const read = (name) => fs.readFileSync(path.join(__dirname, "..", name), "utf8");
function extract(source, name) {
  const match = new RegExp(`(?:async )?function ${name}\\(`).exec(source);
  assert.ok(match);
  const tail = source.slice(match.index);
  const end = tail.slice(1).search(/\n(?:async )?function /);
  return end < 0 ? tail : tail.slice(0, end + 1);
}

test("judge can immediately start a prepared timer even with a legacy 30-second block", async () => {
  let status;
  const state = { meta: { mode: "competition", timerStartBlockedUntil: new Date(Date.now() + 30000).toISOString(),
    attemptTimer: { seconds: 60, key: "a:snatch:1" } } };
  const ctx = vm.createContext({ state, readJson: async () => ({ token: "judge" }),
    getRoleForToken: () => "solo", canControlAttempts: () => true, getActiveRoleKeys: () => ["solo"],
    syncPhase: () => {}, ensureAttemptTimerForCurrent: () => {}, getCurrentAttempt: () => ({ athlete: { id: "a" } }),
    attemptKey: () => "a:snatch:1", parseInteger: Number, persistState: async () => {}, broadcastState: () => {},
    sendJson: (req, code) => { status = code; } });
  vm.runInContext(extract(read("server.js"), "startTimerFromJudge"), ctx);
  await ctx.startTimerFromJudge({}, {});
  assert.equal(status, 200);
  assert.equal(state.meta.attemptTimer.startedBy, "solo");
  assert.equal(state.meta.attemptTimer.seconds, 60);
  ctx.canControlAttempts = () => false;
  await ctx.startTimerFromJudge({}, {});
  assert.equal(status, 401);
});

test("judge start button is enabled without a countdown; permissions still apply", () => {
  const ctx = vm.createContext({ state: { meta: { timerStartBlockedUntil: new Date(Date.now() + 30000).toISOString(),
    attemptTimer: { seconds: 60, key: "current" } } }, els: { timerStart: {}, timerToggle: {} },
    getCurrentAttempt: () => ({}), attemptKey: () => "current", canControlAttempt: () => true });
  vm.runInContext(extract(read("judge.js"), "renderTimerAction"), ctx);
  ctx.renderTimerAction();
  assert.equal(ctx.els.timerStart.disabled, false);
  assert.equal(ctx.els.timerStart.textContent, "Zeit starten");
  ctx.canControlAttempt = () => false;
  ctx.renderTimerAction();
  assert.equal(ctx.els.timerStart.disabled, true);
});

test("a screen station can switch between every supported network view", () => {
  const nodes = new Map();
  for (const id of ["#display-frame", "#waiting-panel"]) nodes.set(id, { classList: { add() {}, remove() {} }, removeAttribute(name) { delete this[name]; } });
  const paths = { control: "/", judge: "/judge", weigh: "/waage", plates: "/plates", scoreboard: "/scoreboard", waitingRoom: "/pi" };
  const ctx = vm.createContext({ ROLE_PATHS: paths, ROLE_LABELS: Object.fromEntries(Object.keys(paths).map((key) => [key, key])),
    currentRole: "", $: (id) => nodes.get(id), document: {}, renderWaiting() {} });
  vm.runInContext(extract(read("display.js"), "applyAssignment"), ctx);
  for (const [role, path] of Object.entries(paths)) {
    ctx.applyAssignment(role);
    assert.equal(nodes.get("#display-frame").src, path);
  }
  ctx.applyAssignment("");
  assert.equal(nodes.get("#display-frame").src, undefined);
});

test("an unassigned station reports connected on initial registration and reconnect", () => {
  let message = "Verbindung wird aufgebaut.";
  const ctx = vm.createContext({ ROLE_PATHS: { waitingRoom: "/pi" }, ROLE_LABELS: {}, currentRole: null,
    $: () => ({ classList: { add() {}, remove() {} }, removeAttribute() {} }), document: {},
    renderWaiting: (text) => { message = text; } });
  vm.runInContext(extract(read("display.js"), "applyAssignment"), ctx);
  ctx.applyAssignment("");
  assert.match(message, /verbunden und wartet/);
  message = "Live-Verbindung wird wiederhergestellt.";
  ctx.applyAssignment("");
  assert.match(message, /verbunden und wartet/);
});
