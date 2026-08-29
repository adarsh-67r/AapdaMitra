from app.sms import SEVERITY_BY_DIGIT, parse_sms_report, resolve_position


def test_parses_a_full_message():
    parsed = parse_sms_report("AM 3 23.242,69.667 bridge collapsed near market")
    assert parsed.severity == "high"
    assert parsed.lat == 23.242
    assert parsed.lng == 69.667
    assert parsed.description == "bridge collapsed near market"


def test_keyword_is_case_insensitive_and_tolerates_stray_whitespace():
    parsed = parse_sms_report("  am  4   19.076,72.877   people trapped  ")
    assert parsed.severity == "critical"
    assert parsed.lat == 19.076
    assert parsed.description == "people trapped"


def test_a_message_without_coordinates_still_parses():
    # A citizen typing by hand cannot know their latitude. The position is
    # filled in from their last report by the caller; the parser's job is only
    # to say that this message did not carry one.
    parsed = parse_sms_report("AM 4 people trapped in the school")
    assert parsed.lat is None
    assert parsed.lng is None
    assert parsed.description == "people trapped in the school"


def test_a_message_that_is_not_ours_is_rejected():
    assert parse_sms_report("hello there") is None
    assert parse_sms_report("") is None


def test_a_severity_outside_the_scale_is_rejected():
    assert parse_sms_report("AM 9 23.242,69.667 water rising") is None
    assert parse_sms_report("AM high 23.242,69.667 water rising") is None


def test_an_impossible_coordinate_is_left_in_the_description():
    # Better to keep every word the citizen sent than to silently swallow a
    # number that only looked like a position.
    parsed = parse_sms_report("AM 2 991.0,69.667 water rising")
    assert parsed.lat is None
    assert parsed.description == "991.0,69.667 water rising"


def test_a_message_with_no_description_still_parses():
    # The SOS path sends exactly this: severity and a position, nothing else.
    parsed = parse_sms_report("AM 4 23.242,69.667")
    assert parsed.severity == "critical"
    assert parsed.description == ""


def test_the_scale_matches_the_severities_the_database_accepts():
    assert SEVERITY_BY_DIGIT == {
        "1": "low",
        "2": "medium",
        "3": "high",
        "4": "critical",
    }


def test_a_message_that_carries_its_own_position_is_exact():
    parsed = parse_sms_report("AM 3 23.242,69.667 bridge down")
    assert resolve_position(parsed, last_known=(19.0, 72.8)) == (23.242, 69.667, "sms")


def test_a_message_without_a_position_falls_back_to_where_they_last_reported():
    # Marked approximate, never "sms": a fallback position is the citizen's last
    # known whereabouts, and the console must not read it as where this incident
    # is. location_source already drives that labelling for manual placement.
    parsed = parse_sms_report("AM 4 people trapped")
    assert resolve_position(parsed, last_known=(19.0, 72.8)) == (19.0, 72.8, "sms-approx")


def test_a_first_time_sender_with_no_position_cannot_be_placed():
    parsed = parse_sms_report("AM 4 people trapped")
    assert resolve_position(parsed, last_known=None) is None
