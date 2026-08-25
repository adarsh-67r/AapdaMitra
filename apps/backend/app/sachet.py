import re
from datetime import datetime, timedelta, timezone

SACHET_URL = "https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails"

MONTHS = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}

IST_OFFSET = timedelta(hours=5, minutes=30)

TIME_PATTERN = re.compile(r"^(\w+) (\w+) (\d+) (\d+):(\d+):(\d+) IST (\d+)$")


def parse_centroid(centroid: str) -> dict | None:
    parts = [p.strip() for p in centroid.split(",")]
    if len(parts) != 2:
        return None
    try:
        lng, lat = float(parts[0]), float(parts[1])
    except ValueError:
        return None
    return {"lat": lat, "lng": lng}


def parse_sachet_time(raw: str) -> str | None:
    if not raw:
        return None
    match = TIME_PATTERN.match(raw)
    if not match:
        return None
    _, mon, day, hh, mm, ss, year = match.groups()
    month = MONTHS.get(mon)
    if month is None:
        return None
    naive = datetime(int(year), month, int(day), int(hh), int(mm), int(ss))
    utc = (naive - IST_OFFSET).replace(tzinfo=timezone.utc)
    return utc.isoformat()


def dedupe_preferring_english(alerts: list[dict]) -> list[dict]:
    by_id: dict[str, dict] = {}
    for a in alerts:
        key = str(a["identifier"])
        existing = by_id.get(key)
        if existing is None or (existing.get("actual_lang") != "en" and a.get("actual_lang") == "en"):
            by_id[key] = a
    return list(by_id.values())
