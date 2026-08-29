"""
Reading an incident report out of a 160-character text message.

PS-05 names no-connectivity zones, and the offline queue only helps a citizen
who later regains data. Voice and SMS survive the congestion that takes data
down first, so this is the path for a phone that has signal but nothing else.

The grammar is deliberately tiny, because it has to survive being typed on a
feature phone by someone in a hurry:

    AM <1-4> [<lat>,<lng>] [free text]
    AM 3 23.242,69.667 bridge collapsed near market

The keyword lets a shared number carry other traffic. The position is optional:
a citizen typing by hand cannot know their latitude, and the caller fills it in
from their last report instead.
"""

from dataclasses import dataclass
import re

# The four values reports.severity is constrained to, smallest first, so a
# digit is all the citizen has to type.
SEVERITY_BY_DIGIT = {
    "1": "low",
    "2": "medium",
    "3": "high",
    "4": "critical",
}

KEYWORD = "AM"

_COORDS = re.compile(r"^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$")


@dataclass
class ParsedSms:
    severity: str
    lat: float | None
    lng: float | None
    description: str


def parse_sms_report(body: str) -> ParsedSms | None:
    """Returns None for anything that is not one of our reports."""
    tokens = (body or "").split()
    if len(tokens) < 2 or tokens[0].upper() != KEYWORD:
        return None

    severity = SEVERITY_BY_DIGIT.get(tokens[1])
    if severity is None:
        return None

    rest = tokens[2:]
    lat = lng = None
    if rest:
        match = _COORDS.match(rest[0])
        if match:
            candidate_lat, candidate_lng = float(match.group(1)), float(match.group(2))
            # An out-of-range pair is not a position. Rather than drop it, it is
            # left in the description: keeping every word the citizen sent is
            # worth more than a tidy parse.
            if -90 <= candidate_lat <= 90 and -180 <= candidate_lng <= 180:
                lat, lng = candidate_lat, candidate_lng
                rest = rest[1:]

    return ParsedSms(severity=severity, lat=lat, lng=lng, description=" ".join(rest))


def resolve_position(
    parsed: ParsedSms, last_known: tuple[float, float] | None
) -> tuple[float, float, str] | None:
    """
    Where the incident is, and how much to trust it.

    reports.lat and reports.lng are NOT NULL, so a report that cannot be placed
    cannot be stored at all. A message that carries no position is placed at the
    sender's last reported one and stamped "sms-approx" — the console already
    treats a non-"device" source as approximate, which is exactly the caveat
    this deserves. A first-time sender with no position anywhere is the one case
    with nothing to fall back on.
    """
    if parsed.lat is not None and parsed.lng is not None:
        return parsed.lat, parsed.lng, "sms"
    if last_known is not None:
        return last_known[0], last_known[1], "sms-approx"
    return None
