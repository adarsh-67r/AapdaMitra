import { SMS_MAX_CHARS, encodeReportSms, smsUri } from "@/lib/sms-fallback";

const BASE = {
  severity: "high",
  lat: 23.242,
  lng: 69.6669,
  description: "bridge collapsed near market",
};

test("encodes severity as a digit, then the position, then the words", () => {
  expect(encodeReportSms(BASE)).toBe("AM 3 23.242,69.6669 bridge collapsed near market");
});

test("rounds the position instead of sending every digit the GPS produced", () => {
  // A device fix carries fifteen decimal places. Four is about eleven metres,
  // which is finer than the 2 km clustering, and the characters it saves are
  // characters of what the citizen actually wrote.
  expect(encodeReportSms({ ...BASE, lat: 23.242000000000004, lng: 69.66690000000001 })).toBe(
    "AM 3 23.242,69.6669 bridge collapsed near market"
  );
});

test("never exceeds one message, truncating the description rather than the position", () => {
  const encoded = encodeReportSms({ ...BASE, description: "x".repeat(400) });

  expect(encoded.length).toBeLessThanOrEqual(SMS_MAX_CHARS);
  expect(encoded.startsWith("AM 3 23.242,69.6669 ")).toBe(true);
});

test("a report with no description is still a valid message", () => {
  // This is what SOS sends: a severity and a place, nothing else.
  expect(encodeReportSms({ ...BASE, severity: "critical", description: "" })).toBe(
    "AM 4 23.242,69.6669"
  );
});

test("builds the composer link each platform understands", () => {
  // Android separates the query with ?, iOS with &. Getting it wrong opens the
  // composer with an empty body and no error.
  expect(smsUri("+911234567890", "AM 4 1,2", "android")).toBe(
    "smsto:+911234567890?body=AM%204%201%2C2"
  );
  expect(smsUri("+911234567890", "AM 4 1,2", "ios")).toBe(
    "sms:+911234567890&body=AM%204%201%2C2"
  );
});
