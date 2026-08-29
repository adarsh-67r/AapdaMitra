import pytest

from app.facilities import (
    KIND_BY_NAME,
    MAX_BOX_DEGREES,
    Bbox,
    FacilityQueryError,
    parse_kinds,
    validate_bbox,
)


def test_kinds_parse_to_the_codes_stored_in_the_table():
    assert parse_kinds("hospital,police,fire") == [0, 1, 2]


def test_kinds_tolerate_spacing_and_case():
    assert parse_kinds(" Hospital , FIRE ") == [0, 2]


def test_a_repeated_kind_is_asked_for_once():
    assert parse_kinds("fire,fire,fire") == [2]


def test_an_unknown_kind_is_refused_rather_than_silently_dropped():
    # Dropping it would answer a question nobody asked: the caller believes it
    # is seeing schools and is really seeing nothing.
    with pytest.raises(FacilityQueryError):
        parse_kinds("hospital,school")


def test_no_kinds_at_all_is_refused():
    with pytest.raises(FacilityQueryError):
        parse_kinds("")


def test_every_kind_name_maps_to_a_distinct_code():
    assert sorted(KIND_BY_NAME.values()) == [0, 1, 2]


def test_a_normal_view_passes():
    box = validate_bbox(south=13.02, west=80.20, north=13.09, east=80.28)
    assert box == Bbox(south=13.02, west=80.20, north=13.09, east=80.28)


def test_a_box_wider_than_the_cap_is_refused():
    # The server-side half of the zoom-11 gate: without it one request can ask
    # for every facility in India.
    with pytest.raises(FacilityQueryError):
        validate_bbox(south=8.0, west=68.0, north=8.0 + MAX_BOX_DEGREES + 0.1, east=68.5)


def test_a_box_taller_than_the_cap_is_refused():
    with pytest.raises(FacilityQueryError):
        validate_bbox(south=8.0, west=68.0, north=8.5, east=68.0 + MAX_BOX_DEGREES + 0.1)


def test_an_inverted_box_is_refused():
    with pytest.raises(FacilityQueryError):
        validate_bbox(south=13.09, west=80.20, north=13.02, east=80.28)


def test_coordinates_outside_the_world_are_refused():
    with pytest.raises(FacilityQueryError):
        validate_bbox(south=-91.0, west=80.20, north=-90.5, east=80.28)
    with pytest.raises(FacilityQueryError):
        validate_bbox(south=13.02, west=179.9, north=13.09, east=180.5)


def test_a_box_exactly_at_the_cap_is_allowed():
    # The cap is a limit, not a wall to stand back from — a view that is
    # precisely one degree across is a legitimate view.
    box = validate_bbox(south=8.0, west=68.0, north=8.0 + MAX_BOX_DEGREES, east=68.0)
    assert box.north - box.south == MAX_BOX_DEGREES
