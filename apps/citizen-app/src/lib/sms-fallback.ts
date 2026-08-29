/**
 * Filing a report as a text message, for a phone with signal but no data.
 *
 * The offline queue only helps a citizen who later regains data. SMS rides the
 * voice network, which survives the congestion that takes data down first, so
 * this is the path out of a no-connectivity zone rather than a wait inside one.
 *
 * The grammar is the one apps/backend/app/sms.py parses. Both ends are small
 * and both are written down; there is no schema between them.
 */

/** One GSM-7 message. Past this the carrier splits it, and a split can arrive
 *  out of order or half-delivered — neither of which this grammar survives. */
export const SMS_MAX_CHARS = 160;

/** Four decimals is about eleven metres, far finer than the 2 km clustering. */
const COORD_DECIMALS = 4;

const DIGIT_BY_SEVERITY: Record<string, string> = {
  low: "1",
  medium: "2",
  high: "3",
  critical: "4",
};

export interface SmsReport {
  severity: string;
  lat: number;
  lng: number;
  description: string;
}

function coord(value: number): string {
  // Trailing zeros carry no information and cost characters of description.
  return String(Number(value.toFixed(COORD_DECIMALS)));
}

export function encodeReportSms(report: SmsReport): string {
  const head = `AM ${DIGIT_BY_SEVERITY[report.severity] ?? "2"} ${coord(report.lat)},${coord(report.lng)}`;
  const description = report.description.trim();
  if (!description) return head;

  // The position is never what gets cut: a report placed nowhere is no use to
  // anyone, while a report described in half its words still routes a team.
  const room = SMS_MAX_CHARS - head.length - 1;
  return room <= 0 ? head : `${head} ${description.slice(0, room)}`.trimEnd();
}

/**
 * The link that opens the phone's own SMS composer, pre-filled.
 *
 * Not a silent send: Android gates SEND_SMS and Play policy bars it for
 * anything that is not the default messaging app, so the citizen presses send.
 * The upside is that this needs no permission and no native module.
 */
export function smsUri(number: string, body: string, platform: "android" | "ios"): string {
  const separator = platform === "ios" ? "&" : "?";
  const scheme = platform === "ios" ? "sms" : "smsto";
  return `${scheme}:${number}${separator}body=${encodeURIComponent(body)}`;
}

/**
 * The number the gateway SIM answers on.
 *
 * Unset until there is one, and the button stays hidden while it is: offering a
 * fallback that goes nowhere is worse than not offering one.
 */
export const SMS_GATEWAY_NUMBER = process.env.EXPO_PUBLIC_SMS_GATEWAY || null;
