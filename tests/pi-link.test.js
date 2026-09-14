const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

test("Pi and screen links redirect trailing slashes without losing query parameters", async () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  const start = source.indexOf("async function route(");
  const end = source.indexOf("\nasync function ", start + 1);
  const ctx = vm.createContext({ URL, PORT: 8765 });
  vm.runInContext(source.slice(start, end), ctx);
  for (const route of ["/pi", "/warteraum-anzeige", "/display", "/dashboard"]) {
    let result;
    await ctx.route({ url: route + "/?name=Pi", headers: { host: "192.168.1.20:8765" }, method: "GET" }, {
      writeHead(code, headers) { result = { code, location: headers.Location }; }, end() {},
    });
    assert.deepEqual(result, { code: 302, location: route + "?name=Pi" });
  }
});
