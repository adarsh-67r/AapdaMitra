// One-off: turns the old single-file facility index into one-degree cells.
//
//   node supabase/scripts/split-facility-index.js apps/web/public/india-facilities.json
//
// build-facility-index.js writes the cells directly now; this exists so the
// split could be done without re-running the Overpass extracts.
const fs = require("fs");
const path = require("path");

const { writeFacilityCells } = require("./facility-cells");

const input = process.argv[2];
if (!input) {
  console.error("usage: node split-facility-index.js <india-facilities.json>");
  process.exit(1);
}

const outDir = path.join(path.dirname(input), "facilities");
const rows = JSON.parse(fs.readFileSync(input, "utf8"));
const { cells, largest } = writeFacilityCells(rows, outDir);

console.log(
  `${rows.length} facilities into ${cells} cells · largest ${(largest / 1024).toFixed(1)} KB · ${outDir}`
);
