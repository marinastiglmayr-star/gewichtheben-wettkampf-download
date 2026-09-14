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

test("all three competition lists are downloaded as PDF files", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  for (const name of ["generateReport", "generateStartLists", "generateRegistrationList"]) {
    const block = extract("app.js", name);
    assert.match(block, /\.pdf`/);
    assert.match(block, /downloadPrintablePdf/);
    assert.doesNotMatch(block, /text\/html|\.html`/);
  }
  assert.match(source, /fetch\("\/api\/pdf"/);
});

test("PDF filenames are cleaned and always end in pdf", () => {
  const context = vm.createContext({ path });
  vm.runInContext(extract("server.js", "sanitizePdfFilename"), context);
  assert.equal(context.sanitizePdfFilename("Meine Meldeliste.pdf"), "Meine-Meldeliste.pdf");
  assert.equal(context.sanitizePdfFilename("../Ergebnisliste"), "Ergebnisliste.pdf");
});

