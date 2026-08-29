from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from app.db import get_conn
from app.deps import get_current_user
from app.facilities import (
    KIND_NAMES,
    FacilityQueryError,
    parse_kinds,
    validate_bbox,
)

router = APIRouter(prefix="/facilities", tags=["facilities"])

"""
More markers than this in one view is unreadable and slow to draw, on a phone
most of all. Hitting the cap is itself information — "there are more here than
I am showing you" — so the total is returned alongside.
"""
MAX_MARKERS = 400


@router.get("")
def list_facilities(
    south: float = Query(...),
    west: float = Query(...),
    north: float = Query(...),
    east: float = Query(...),
    kinds: str = Query(..., description="comma-separated: hospital, police, fire"),
    conn: Connection = Depends(get_conn),
    user: dict = Depends(get_current_user),
):
    """
    The facilities of the requested kinds inside the view.

    Reference data, so this is readable by any signed-in account rather than
    gated to authorities: a citizen looking for the nearest hospital is the
    reason it exists.
    """
    try:
        box = validate_bbox(south=south, west=west, north=north, east=east)
        codes = parse_kinds(kinds)
    except FacilityQueryError as e:
        raise HTTPException(status_code=400, detail=str(e))

    with conn.cursor() as cur:
        cur.execute(
            "select count(*) as n from facilities "
            "where kind = any(%s) and lat between %s and %s and lng between %s and %s",
            (codes, box.south, box.north, box.west, box.east),
        )
        total = cur.fetchone()["n"]

        cur.execute(
            "select kind, lat, lng, name from facilities "
            "where kind = any(%s) and lat between %s and %s and lng between %s and %s "
            "limit %s",
            (codes, box.south, box.north, box.west, box.east, MAX_MARKERS),
        )
        rows = cur.fetchall()

    return {
        "shown": [
            {"kind": KIND_NAMES[r["kind"]], "lat": r["lat"], "lng": r["lng"], "name": r["name"]}
            for r in rows
        ],
        "total": total,
    }
