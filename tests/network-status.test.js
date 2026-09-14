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
    LOCAL_WINDOW_TARGETS: [], escapeHtml: String, getRefereeSlots: () => [], renderControlClientStatus: () => "", renderConnectionLinks: () => "", renderFixedDisplaySlots: () => "" });
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
