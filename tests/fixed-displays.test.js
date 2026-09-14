const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
function extract(file, name) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const start = source.indexOf(`function ${name}(`);
  const end = source.slice(start + 1).search(/\n(?:async )?function /);
  assert.ok(start >= 0, name);
  return end < 0 ? source.slice(start) : source.slice(start, start + end + 1);
}

test("display1, display2 and display3 use stable identities independent of local storage", () => {
  const code = extract("display.js", "getOrCreateDisplayId");
  for (const slot of [1, 2, 3]) {
    const ctx = vm.createContext({ location: { pathname: `/display${slot}` }, localStorage: { getItem: () => "other" } });
    vm.runInContext(code, ctx);
    assert.equal(ctx.getOrCreateDisplayId(), `display${slot}`);
  }
});

test("fixed display controls expose all three copyable links and all supported views", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const roles = ["", "control", "judge", "weigh", "plates", "scoreboard", "waitingRoom"];
  const ctx = vm.createContext({ sessionInfo: { controlUrls: ["http://localhost:8765/", "http://192.168.1.20:8765/"], displayClients: [], displayAssignments: { display2: "plates" } },
    renderConnectionLinks: (urls) => urls.join("|"), renderDisplayRoleOptions: (selected) => `role:${selected}` });
  vm.runInContext(extract("app.js", "renderFixedDisplaySlots"), ctx);
  const html = ctx.renderFixedDisplaySlots();
  for (const slot of [1, 2, 3]) assert.match(html, new RegExp(`192\\.168\\.1\\.20:8765/display${slot}`));
  assert.match(html, /role:plates/);
  const roleBlock = source.match(/const DISPLAY_ROLES = \[[\s\S]*?\n\];/)[0];
  for (const role of roles.slice(1)) assert.match(roleBlock, new RegExp(`key: "${role}"`));
  assert.doesNotMatch(roleBlock, /dashboard|waitingInput/);
});
