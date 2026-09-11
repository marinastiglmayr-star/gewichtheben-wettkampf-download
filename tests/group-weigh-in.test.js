const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

// Run the production transition functions without opening browser windows or a server.
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const names = ["weighInStatus", "getOrderedGroups", "getAthleteGroupId", "athletesForGroup",
  "firstStartingGroupId", "firstPendingGroupId", "markGroupLiftComplete", "validateStartList",
  "startCompetition", "resetCompetition", "startNextGroup", "saveWeighInFromForm"];
const functions = names.map((name) => {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1);
  const end = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, end < 0 ? undefined : end);
}).join("\n");

function athlete(id, groupId, values = {}) {
  return { id, name: id, groupId, ageClass: "senior", weightClass: "81", bodyweight: 78,
    openers: { snatch: 60, cleanJerk: 80 }, next: { snatch: 60, cleanJerk: 80 },
    attempts: { snatch: [], cleanJerk: [] }, withdrawn: false, ...values };
}

function app(athletes) {
  const context = vm.createContext({
    state: { meta: { mode: "setup" }, groups: ["A", "B", "C"].map((id, order) => ({ id, name: id, order })), athletes },
    window: { confirm: () => true }, isMastersAgeClass: () => false, isIwfMode: () => false,
    iwfAthleteStartWarning: (item) => item.warning || "", showToast: () => {},
    saveState: () => {}, render: () => {}, ensureAttemptTimerForCurrent: () => {},
    openPlateWindow: () => {}, openScoreboardWindow: () => {}, openWaitingRoomDisplayWindow: () => {},
  });
  vm.runInContext(functions, context);
  return context;
}

test("only the first starting group needs any weigh-in data", () => {
  const ctx = app([athlete("a", "A"), athlete("b", "B", { bodyweight: null, openers: {} })]);
  assert.equal(ctx.validateStartList(), "");
  const later = JSON.stringify(ctx.state.athletes[1]);
  ctx.startCompetition();
  assert.equal(ctx.state.meta.activeGroupId, "A");
  assert.equal(ctx.state.athletes[1].withdrawn, false);
  assert.equal(ctx.state.athletes[1].bodyweight, null);
  assert.equal(JSON.parse(later).withdrawn, false);
});

test("empty first-group weigh-in blocks start without changing data", () => {
  const ctx = app([athlete("a", "A", { bodyweight: null, openers: {} })]);
  const before = JSON.stringify(ctx.state);
  ctx.startCompetition();
  assert.equal(JSON.stringify(ctx.state), before);
  assert.match(ctx.validateStartList(), /Waagewerte/);
});

test("group order and manually absent athletes determine the first starting group", () => {
  const ctx = app([athlete("a", "A", { withdrawn: true, bodyweight: null }), athlete("b", "B"),
    athlete("c", "C", { bodyweight: null, openers: {} })]);
  assert.equal(ctx.validateStartList(), "");
  ctx.startCompetition();
  assert.equal(ctx.state.meta.activeGroupId, "B");
  assert.equal(ctx.state.athletes[0].withdrawn, true);
});

test("next group marks only empty weigh-ins absent, preserving partial values and later groups", () => {
  const ctx = app([athlete("a", "A"), athlete("b", "B"),
    athlete("partial", "B", { openers: { snatch: 60, cleanJerk: null } }),
    athlete("empty", "B", { bodyweight: null, openers: {} }),
    athlete("manual", "B", { withdrawn: true }), athlete("later", "C", { bodyweight: null })]);
  ctx.state.groups[0].completed = true;
  ctx.startNextGroup();
  assert.equal(ctx.state.meta.activeGroupId, "B");
  assert.deepEqual(ctx.state.athletes.map((item) => item.withdrawn), [false, false, false, true, true, false]);
  assert.equal(ctx.state.athletes[2].bodyweight, 78);
  assert.deepEqual(ctx.state.athletes[2].openers, { snatch: 60, cleanJerk: null });
});

test("entirely missing groups are skipped and the competition finishes if none remain", () => {
  const ctx = app([athlete("a", "A"), athlete("b", "B", { bodyweight: null, openers: {} }),
    athlete("c", "C", { bodyweight: null, openers: {} })]);
  ctx.state.groups[0].completed = true;
  ctx.startNextGroup();
  assert.equal(ctx.state.meta.mode, "finished");
  assert.ok(ctx.state.groups.every((group) => group.completed));
  assert.ok(ctx.state.athletes.slice(1).every((item) => item.withdrawn));
});

test("returning to setup and restarting preserves all weigh-in values and missing flags", () => {
  const ctx = app([athlete("a", "A"), athlete("manual", "A", { withdrawn: true, bodyweight: null }),
    athlete("automatic", "B", { bodyweight: null, openers: {} })]);
  ctx.startCompetition();
  ctx.state.groups[0].completed = true;
  ctx.startNextGroup();
  const weighData = () => JSON.stringify(ctx.state.athletes.map(({ bodyweight, openers, weightClass, withdrawn }) =>
    ({ bodyweight, openers, weightClass, withdrawn })));
  const before = weighData();
  ctx.resetCompetition();
  assert.equal(weighData(), before);
  ctx.startCompetition();
  assert.equal(ctx.state.meta.mode, "competition");
  assert.equal(weighData(), before);
});

test("any single weigh-in value permits start and preserves partial data in either scoring mode", () => {
  for (const values of [
    { bodyweight: 78, openers: {} },
    { bodyweight: null, openers: { snatch: 60 } },
    { bodyweight: null, openers: { cleanJerk: 80 } },
  ]) {
    for (const iwf of [false, true]) {
      const ctx = app([athlete("a", "A", values)]);
      ctx.isIwfMode = () => iwf;
      ctx.iwfAthleteStartWarning = () => { throw new Error("Partial openers must not block start"); };
      const before = JSON.stringify(values);
      assert.equal(ctx.validateStartList(), "");
      ctx.startCompetition();
      assert.equal(ctx.state.meta.mode, "competition");
      assert.equal(ctx.state.athletes[0].withdrawn, false);
      assert.equal(JSON.stringify(values), before);
    }
  }
});

test("IWF opener validation is deferred until that group starts", () => {
  const ctx = app([athlete("a", "A"), athlete("b", "B", { warning: "IWF-Mindestgewicht" })]);
  ctx.isIwfMode = () => true;
  assert.equal(ctx.validateStartList(), "");
  ctx.state.groups[0].completed = true;
  ctx.state.meta.mode = "groupComplete";
  ctx.state.meta.activeGroupId = "A";
  ctx.startNextGroup();
  assert.equal(ctx.state.meta.activeGroupId, "A");
  assert.equal(ctx.state.meta.mode, "groupComplete");
});

test("weighing a later group during competition updates its pending opening attempts", () => {
  const b = athlete("b", "B", { bodyweight: null, openers: {}, next: {} });
  const ctx = app([athlete("a", "A"), b]);
  ctx.state.meta.mode = "competition";
  ctx.els = { weighAthlete: { value: "b" }, weighBodyweight: { value: 78 },
    weighSnatch: { value: 61 }, weighCj: { value: 81 } };
  ctx.findAthlete = () => b;
  ctx.parseOptionalPositiveFloat = Number;
  ctx.parseOptionalPositiveInteger = Number;
  ctx.weightClassForBodyweight = () => "81";
  ctx.renderWeighInAthleteOptions = () => {};
  ctx.loadWeighInAthlete = () => {};
  assert.equal(ctx.saveWeighInFromForm(), true);
  assert.equal(b.next.snatch, 61);
  assert.equal(b.next.cleanJerk, 81);
  b.attempts.snatch.push({ good: true });
  b.next.snatch = 65;
  ctx.saveWeighInFromForm();
  assert.equal(b.next.snatch, 65);
});
