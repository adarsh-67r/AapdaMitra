from app.allocator import haversine_km, pick_nearest_available


def test_haversine_same_point_is_zero():
    p = {"lat": 13.0827, "lng": 80.2707}
    assert haversine_km(p, p) == 0


def test_haversine_known_distance_chennai_to_bangalore():
    chennai = {"lat": 13.0827, "lng": 80.2707}
    bangalore = {"lat": 12.9716, "lng": 77.5946}
    d = haversine_km(chennai, bangalore)
    assert 280 < d < 300, f"expected ~290km, got {d}"


RESOURCES = [
    {"id": "near", "type": "shelter", "lat": 13.06, "lng": 80.24, "status": "available"},
    {"id": "far", "type": "shelter", "lat": 12.9, "lng": 80.1, "status": "available"},
    {"id": "closer-but-full", "type": "shelter", "lat": 13.05, "lng": 80.25, "status": "full"},
]


def test_picks_nearest_available():
    report = {"lat": 13.05, "lng": 80.24}
    result = pick_nearest_available(report, RESOURCES)
    assert result["id"] == "near"


def test_skips_unavailable_even_if_closer():
    report = {"lat": 13.051, "lng": 80.251}
    result = pick_nearest_available(report, RESOURCES)
    assert result["id"] == "near"


def test_returns_none_when_nothing_available():
    report = {"lat": 13.05, "lng": 80.24}
    all_full = [{**r, "status": "full"} for r in RESOURCES]
    result = pick_nearest_available(report, all_full)
    assert result is None


def test_can_filter_by_resource_type():
    with_team = RESOURCES + [
        {"id": "team", "type": "rescue_team", "lat": 13.051, "lng": 80.241, "status": "available"}
    ]
    report = {"lat": 13.05, "lng": 80.24}
    result = pick_nearest_available(report, with_team, resource_type="rescue_team")
    assert result["id"] == "team"
