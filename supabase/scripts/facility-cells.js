// Writes the facility index as a grid of one-degree cells.
//
// The layer used to ship as a single 2.9 MB india-facilities.json. Ticking one
// of the three checkboxes fetched all of it, parsed it, and turned 58,232 rows
// into 58,232 objects on the main thread before a single marker could be drawn
// — on a phone, long enough for the browser to offer to reload the page. None
// of that work was needed: the layer only draws at zoom 11 or closer, where the
// viewport is a small fraction of one degree, so a view needs at most four
// cells and usually one.
//
// One degree is roughly 110 km. At that size the densest cells (Delhi, Mumbai,
// Kolkata) are tens of kilobytes and the median is a few, which is a fetch a
// 2G connection can finish.
const fs = require("fs");
const path = require("path");

const CELL_DEGREES = 1;

/** The cell a point falls in. Same rule as cellsForBounds on the client. */
function cellKey(lat, lng) {
  return `${Math.floor(lat / CELL_DEGREES)}_${Math.floor(lng / CELL_DEGREES)}`;
}

/**
 * `rows` are [kind, lat, lng, name] tuples. Writes one file per non-empty cell
 * plus an index of the cells that exist, so the client asks only for files that
 * are there instead of treating a 404 as an error it has to explain.
 */
function writeFacilityCells(rows, outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const byCell = new Map();
  for (const row of rows) {
    const key = cellKey(row[1], row[2]);
    let cell = byCell.get(key);
    if (!cell) byCell.set(key, (cell = []));
    cell.push(row);
  }

  let largest = 0;
  for (const [key, cell] of byCell) {
    const json = JSON.stringify(cell);
    if (json.length > largest) largest = json.length;
    fs.writeFileSync(path.join(outDir, `${key}.json`), json);
  }

  const cells = [...byCell.keys()].sort();
  fs.writeFileSync(
    path.join(outDir, "index.json"),
    JSON.stringify({ degrees: CELL_DEGREES, cells })
  );

  return { cells: cells.length, largest };
}

module.exports = { CELL_DEGREES, cellKey, writeFacilityCells };
