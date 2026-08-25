from app.sachet import parse_centroid, parse_sachet_time, dedupe_preferring_english


def test_parse_centroid_valid():
    result = parse_centroid("80.2376,13.0827")
    assert result == {"lat": 13.0827, "lng": 80.2376}


def test_parse_centroid_invalid_returns_none():
    assert parse_centroid("not,valid") is None
    assert parse_centroid("80.2376") is None


def test_parse_sachet_time_valid():
    result = parse_sachet_time("Mon Aug 24 23:46:00 IST 2026")
    # IST is UTC+5:30, so 23:46 IST on Aug 24 is 18:16 UTC on Aug 24.
    assert result == "2026-08-24T18:16:00+00:00"


def test_parse_sachet_time_invalid_returns_none():
    assert parse_sachet_time("") is None
    assert parse_sachet_time("garbage") is None


def test_dedupe_prefers_english():
    alerts = [
        {"identifier": 1, "actual_lang": "hi", "warning_message": "hindi msg"},
        {"identifier": 1, "actual_lang": "en", "warning_message": "english msg"},
        {"identifier": 2, "actual_lang": "en", "warning_message": "only one"},
    ]
    result = dedupe_preferring_english(alerts)
    assert len(result) == 2
    by_id = {a["identifier"]: a for a in result}
    assert by_id[1]["warning_message"] == "english msg"
    assert by_id[2]["warning_message"] == "only one"
