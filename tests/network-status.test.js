const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
function extract(file, name) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const start = source.indexOf(`function ${name}(`);
  const end = source.slice(start + 1).search(/\n(?:async )?function /);
  return end < 0 ? source.slice(start) : source.slice(start, start + end + 1);
}

test("network heartbeats keep the DOM stable and do not replace selected text", () => {
  let writes = 0;
  let selection = { isCollapsed: true };
  const panel = { classList: { toggle() {} }, contains: () => true, set innerHTML(value) { writes++; } };
  const ctx = vm.createContext({ els: { connectionPanel: panel }, serverMode: true,
    window: { getSelection: () => selection }, state: { meta: {} }, sessionInfo: { code: "1234", urls: ["http://192.168.1.2:8765/judge"] },
    escapeHtml: String, getRefereeSlots: () => [], renderControlClientStatus: () => "", renderConnectionLinks: () => "" });
  vm.runInContext(extract("app.js", "renderConnection"), ctx);
  ctx.renderConnection();
  ctx.renderConnection();
  assert.equal(writes, 1);
  selection = { isCollapsed: false, anchorNode: {}, focusNode: {} };
  ctx.sessionInfo.code = "5678";
  ctx.renderConnection();
  assert.equal(writes, 1);
  selection = { isCollapsed: true };
  ctx.renderConnection();
  assert.equal(writes, 2);
});

test("a dashboard-only PC registers and keeps its token on subsequent heartbeats", async () => {
  const sent = [];
  let tick;
  const ctx = vm.createContext({ localStorage: { getItem: () => null, setItem() {} },
    setInterval: (callback) => { tick = callback; }, fetch: async (url, options) => {
      sent.push({ url, body: JSON.parse(options.body) });
      return { ok: true, json: async () => ({ token: "dashboard-test" }) };
    } });
  vm.runInContext(extract("dashboard.js", "startDashboardPresence"), ctx);
  ctx.startDashboardPresence();
  await new Promise(setImmediate);
  await tick();
  assert.equal(sent.length, 2);
  assert.equal(sent[0].url, "/api/control/register");
  assert.equal(sent[0].body.name, "Dashboard-PC");
  assert.equal(sent[1].body.token, "dashboard-test");
});
