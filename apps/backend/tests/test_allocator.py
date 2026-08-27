import pytest

from app.allocator import (
    FAR_DISPATCH_KM,
    haversine_km,
    pick_best_resource,
    preferred_type_for,
)


def test_haversine_same_point_is_zero():
    p = {"lat": 13.0827, "lng": 80.2707}
    assert haversine_km(p, p) == 0


def test_haversine_known_distance_chennai_to_bangalore():
    chennai = {"lat": 13.0827, "lng": 80.2707}
    bangalore = {"lat": 12.9716, "lng": 77.5946}
    d = haversine_km(chennai, bangalore)
    assert 280 < d < 300, f"expected ~290km, got {d}"


def r(id, type="shelter", lat=13.06, lng=80.24, status="available", capacity=50):
    return {"id": id, "type": type, "lat": lat, "lng": lng, "status": status, "capacity": capacity}


REPORT = {"lat": 13.05, "lng": 80.24, "severity": "medium"}


class TestAvailability:
    def test_picks_nearest_available(self):
        chosen, _ = pick_best_resource(REPORT, [r("near"), r("far", lat=12.9, lng=80.1)])
        assert chosen["id"] == "near"

    def test_skips_unavailable_even_if_closer(self):
        pool = [r("near"), r("closer", lat=13.051, lng=80.2401, status="full")]
        chosen, _ = pick_best_resource(REPORT, pool)
        assert chosen["id"] == "near"

    def test_returns_none_when_nothing_available(self):
        chosen, distance = pick_best_resource(REPORT, [r("a", status="full"), r("b", status="dispatched")])
        assert chosen is None and distance is None

    def test_returns_none_for_empty_pool(self):
        assert pick_best_resource(REPORT, []) == (None, None)


class TestCapacity:
    def test_skips_resource_with_no_remaining_capacity(self):
        pool = [r("exhausted", capacity=0, lat=13.0501, lng=80.2401), r("has-room", capacity=40)]
        chosen, _ = pick_best_resource(REPORT, pool)
        assert chosen["id"] == "has-room"

    def test_unknown_capacity_is_still_eligible(self):
        # A rescue team may legitimately carry no capacity figure; absent data
        # must not be read as "full".
        chosen, _ = pick_best_resource(REPORT, [r("unknown", capacity=None)])
        assert chosen["id"] == "unknown"

    def test_prefers_more_capacity_when_distance_is_close(self):
        pool = [r("small", capacity=5), r("large", capacity=400, lat=13.0601, lng=80.2401)]
        chosen, _ = pick_best_resource(REPORT, pool)
        assert chosen["id"] == "large"


class TestRange:
    def test_allocates_however_far_the_only_resource_is(self):
        # Product decision: never refuse on distance. Sparse regions must still
        # get a dispatch, with the distance reported so it can be judged.
        far = r("far-away", lat=28.6139, lng=77.209)  # Delhi, ~1750km
        chosen, distance = pick_best_resource(REPORT, [far])
        assert chosen["id"] == "far-away"
        assert distance > 1000

    def test_still_prefers_the_nearer_of_two(self):
        pool = [r("near"), r("far-away", lat=28.6139, lng=77.209)]
        chosen, _ = pick_best_resource(REPORT, pool)
        assert chosen["id"] == "near"

    def test_reports_the_distance_of_the_chosen_resource(self):
        chosen, distance = pick_best_resource(REPORT, [r("near")])
        assert chosen["id"] == "near"
        assert 0 < distance < 5

    def test_max_range_bounds_a_search_when_a_caller_asks_for_one(self):
        far = r("far-away", lat=12.9716, lng=77.5946)  # Bengaluru, ~290km
        assert pick_best_resource(REPORT, [far], max_km=100)[0] is None
        chosen, _ = pick_best_resource(REPORT, [far], max_km=400)
        assert chosen["id"] == "far-away"


class TestSuitability:
    @pytest.mark.parametrize("severity", ["critical", "high"])
    def test_severe_reports_prefer_a_rescue_team(self, severity):
        assert preferred_type_for(severity) == "rescue_team"

    @pytest.mark.parametrize("severity", ["medium", "low", None, "nonsense"])
    def test_other_reports_have_no_preferred_type(self, severity):
        assert preferred_type_for(severity) is None

    def test_critical_report_takes_a_slightly_further_rescue_team(self):
        pool = [
            r("shelter-next-door", type="shelter"),
            r("team", type="rescue_team", lat=13.11, lng=80.24),  # ~7km further
        ]
        chosen, _ = pick_best_resource({**REPORT, "severity": "critical"}, pool)
        assert chosen["id"] == "team"

    def test_but_not_an_absurdly_further_one(self):
        pool = [
            r("shelter-next-door", type="shelter"),
            r("team", type="rescue_team", lat=13.9, lng=80.24),  # ~95km further
        ]
        chosen, _ = pick_best_resource({**REPORT, "severity": "critical"}, pool)
        assert chosen["id"] == "shelter-next-door"

    def test_explicit_type_filter_still_wins_over_preference(self):
        pool = [r("shelter", type="shelter"), r("team", type="rescue_team")]
        chosen, _ = pick_best_resource(
            {**REPORT, "severity": "critical"}, pool, resource_type="shelter"
        )
        assert chosen["id"] == "shelter"


def test_far_dispatch_threshold_is_a_sane_flag_value():
    assert 50 <= FAR_DISPATCH_KM <= 300
