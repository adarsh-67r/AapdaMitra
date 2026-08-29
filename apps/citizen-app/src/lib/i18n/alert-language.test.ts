import { foreignLanguageLabel, sortAlertsByLanguage } from "@/lib/i18n/alert-language";

const alerts = [
  { id: "a", language: "en" },
  { id: "b", language: "or" },
  { id: "c", language: "hi" },
  { id: "d", language: null },
  { id: "e", language: "hi" },
];

test("puts the reader's own language first, then English, then the rest", () => {
  // SACHET publishes each alert in one language as its own alert, not as
  // translations of one another, so this is a matter of ordering what exists
  // rather than translating anything. Translating an official warning would put
  // our words in NDMA's mouth.
  expect(sortAlertsByLanguage(alerts, "hi").map((a) => a.id)).toEqual([
    "c",
    "e",
    "a",
    "b",
    "d",
  ]);
});

test("keeps the feed's own order within each group", () => {
  // The feed is newest-first and that ordering is the alert's urgency. Grouping
  // by language must not shuffle it.
  expect(sortAlertsByLanguage(alerts, "en").map((a) => a.id)).toEqual([
    "a",
    "b",
    "c",
    "d",
    "e",
  ]);
});

test("labels an alert a reader may not be able to read", () => {
  expect(foreignLanguageLabel({ language: "or" }, "hi")).toBe("Odia");
  expect(foreignLanguageLabel({ language: "hi" }, "hi")).toBeNull();
});

test("says nothing about an alert whose language the feed did not record", () => {
  // Guessing is worse than silence: a wrong label tells a citizen they cannot
  // read something they can.
  expect(foreignLanguageLabel({ language: null }, "hi")).toBeNull();
});
