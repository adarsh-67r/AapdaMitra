// theme.ts imports global.css for NativeWind's web build. Jest has no CSS
// loader, so the import is stubbed — nothing under test reads from it.
module.exports = {};
