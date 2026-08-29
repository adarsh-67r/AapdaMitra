"""
Reading a facility query off the wire.

The hospitals, police stations and fire stations OpenStreetMap has for India,
which the citizen app draws under the shelter map so someone can see what is
already near them. The rows are static reference data, not part of any incident;
everything interesting here is in refusing a query rather than answering one.

Kept apart from the router so the rules can be tested without a database or an
HTTP client, the same way app/sms.py is.
"""

from dataclasses import dataclass

KIND_BY_NAME: dict[str, int] = {"hospital": 0, "police": 1, "fire": 2}

KIND_NAMES: list[str] = ["hospital", "police", "fire"]

"""
The widest view that will be answered, in degrees — roughly 110 km.

The client only draws this layer at zoom 11 and closer, where the view is a
fraction of this. The cap is the server's own copy of that rule: without it a
single request asks for all 58,232 rows, and a client that has stopped
respecting the zoom gate becomes the database's problem.
"""
MAX_BOX_DEGREES = 1.0


class FacilityQueryError(ValueError):
    """A query that cannot be answered as asked. The router turns this into a 400."""


@dataclass(frozen=True)
class Bbox:
    south: float
    west: float
    north: float
    east: float


def parse_kinds(raw: str) -> list[int]:
    """
    The kind codes behind a comma-separated list of names.

    An unrecognised name is an error rather than something to skip: a caller
    that asks for schools and is quietly given nothing believes it is looking at
    schools and seeing none nearby, which is worse than being told it asked for
    something that does not exist.
    """
    names = [part.strip().lower() for part in raw.split(",") if part.strip()]
    if not names:
        raise FacilityQueryError("no kinds requested")

    codes: list[int] = []
    for name in names:
        if name not in KIND_BY_NAME:
            raise FacilityQueryError(f"unknown kind: {name}")
        code = KIND_BY_NAME[name]
        if code not in codes:
            codes.append(code)
    return codes


def validate_bbox(*, south: float, west: float, north: float, east: float) -> Bbox:
    """The view as a box, or an error saying why it is not one."""
    if not (-90.0 <= south <= 90.0 and -90.0 <= north <= 90.0):
        raise FacilityQueryError("latitude out of range")
    if not (-180.0 <= west <= 180.0 and -180.0 <= east <= 180.0):
        raise FacilityQueryError("longitude out of range")
    if north < south or east < west:
        raise FacilityQueryError("box corners are the wrong way round")
    if north - south > MAX_BOX_DEGREES or east - west > MAX_BOX_DEGREES:
        raise FacilityQueryError(
            f"view is wider than {MAX_BOX_DEGREES} degrees — zoom in"
        )
    return Bbox(south=south, west=west, north=north, east=east)
