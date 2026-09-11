const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
function extract(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, end < 0 ? undefined : end);
}

for (const [file, statusName, styleName] of [
  ["app.js", "weighInStatus", "weighInOptionStyle"],
  ["weigh.js", "weighStatus", "weighStatusStyle"],
]) {
  test(`${file}: all four weigh-in statuses have distinct colors; missing takes priority`, () => {
    const source = read(file);
    const ctx = vm.createContext({});
    vm.runInContext(extract(source, statusName) + "\n" + extract(source, styleName), ctx);
    for (const [athlete, expected, color] of [
      [{}, "empty", "#ffffff"],
      [{ bodyweight: 0, openers: { snatch: null, cleanJerk: "" } }, "empty", "#ffffff"],
      [{ bodyweight: 70 }, "partial", "#fff1c2"],
      [{ openers: { snatch: 50 } }, "partial", "#fff1c2"],
      [{ bodyweight: 70, openers: { snatch: 50, cleanJerk: 60 } }, "complete", "#dff4e7"],
      [{ withdrawn: true }, "missing", "#f7d7d4"],
      [{ withdrawn: true, bodyweight: 70, openers: { snatch: 50, cleanJerk: 60 } }, "missing", "#f7d7d4"],
    ]) {
      assert.equal(ctx[statusName](athlete), expected);
      assert.ok(ctx[styleName](expected).includes(color));
    }
  });
}

test("custom bar weights survive browser/server save-load round trips for every default category", () => {
  const source = read("app.js");
  const defaults = source.match(/const DEFAULT_CATEGORIES = \[[\s\S]*?\n\];/)[0];
  function normalizer(file) {
    const code = read(file);
    const ctx = vm.createContext({ GENDERS: { male: {}, female: {}, child: {} }, BAR_WEIGHTS: { male: 20, female: 15, child: 5 } });
    vm.runInContext(defaults + "\n" + ["normalizeCategories", "uniqueCategoryId", "parseFloatSafe",
      ...(file === "app.js" ? ["slugify", "createDefaultCategories"] : [])].map((name) => extract(code, name)).join("\n"), ctx);
    return ctx;
  }
  const browser = normalizer("app.js");
  const server = normalizer("server.js");
  const edited = browser.createDefaultCategories().map((category, index) => ({ ...category, barWeight: 2.5 + index }));
  let actual = edited;
  for (let i = 0; i < 3; i++) {
    actual = browser.normalizeCategories(JSON.parse(JSON.stringify(server.normalizeCategories(actual))));
    for (const expected of edited) assert.equal(actual.find((row) => row.id === expected.id).barWeight, expected.barWeight);
  }
  assert.equal(browser.createDefaultCategories().find((row) => row.id === "youth-male").barWeight, 20);
});
