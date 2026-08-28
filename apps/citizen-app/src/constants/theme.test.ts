import { Colors } from "@/constants/theme";

/**
 * These values are the contract with apps/web/src/app/globals.css. The two
 * clients are meant to look like one product, and the only thing keeping them
 * aligned is that both lists are written down.
 */
describe("Colors", () => {
  it("matches the web light palette exactly", () => {
    expect(Colors.light).toEqual({
      text: "#1b1a16",
      textSecondary: "#6d6759",
      background: "#f2efe6",
      backgroundElement: "#fbfaf5",
      backgroundSelected: "#e7e2d4",
      border: "#cdc6b5",
      accent: "#b3322a",
      accentContrast: "#fbfaf5",
      critical: "#b3322a",
      high: "#ad5f11",
      medium: "#866c13",
      available: "#2c6742",
      assigned: "#1d537c",
    });
  });

  it("matches the web dark palette exactly", () => {
    expect(Colors.dark).toEqual({
      text: "#f2efe6",
      textSecondary: "#98917f",
      background: "#14120f",
      backgroundElement: "#1c1a16",
      backgroundSelected: "#0f0e0c",
      border: "#35312a",
      accent: "#e0574a",
      accentContrast: "#14120f",
      critical: "#e0574a",
      high: "#d4872f",
      medium: "#c4a844",
      available: "#56ad78",
      assigned: "#57a0d4",
    });
  });

  it("defines the same keys in both themes, so no lookup can fall through", () => {
    expect(Object.keys(Colors.light).sort()).toEqual(Object.keys(Colors.dark).sort());
  });
});
