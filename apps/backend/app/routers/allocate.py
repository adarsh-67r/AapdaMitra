from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection
from pydantic import BaseModel
from app.db import get_conn
from app.deps import require_authority
from app.allocator import MAX_DISPATCH_KM, pick_best_resource

router = APIRouter(tags=["allocate"])


class AllocateBody(BaseModel):
    report_id: str
    resource_type: str | None = None
    # Lets an operator deliberately search past the default ceiling when nothing
    # is nearby. Widening is always a human decision: silently dispatching a unit
    # hundreds of kilometres away is the failure mode the ceiling exists to stop.
    max_km: float | None = None


@router.post("/allocate")
def allocate(
    body: AllocateBody,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(require_authority),
):
    with conn.cursor() as cur:
        cur.execute("select id, lat, lng, status, severity from reports where id = %s", (body.report_id,))
        report = cur.fetchone()
        if not report:
            raise HTTPException(status_code=404, detail="report not found")
        if report["status"] != "open":
            raise HTTPException(status_code=409, detail=f"report is already {report['status']}")

        cur.execute("select id, type, name, lat, lng, status, capacity from resources")
        resources = cur.fetchall()

        max_km = body.max_km or MAX_DISPATCH_KM
        chosen, distance_km = pick_best_resource(report, resources, body.resource_type, max_km)
        if not chosen:
            available = sum(1 for r in resources if r["status"] == "available")
            if available == 0:
                return {
                    "assigned": False,
                    "reason": "No resource is currently available. Free one up under Resources.",
                    "out_of_range": False,
                }
            # Say how far the nearest one actually is, so the operator can judge
            # whether widening the search is reasonable rather than guessing.
            nearest, nearest_km = pick_best_resource(
                report, resources, body.resource_type, max_km=40_000
            )
            return {
                "assigned": False,
                "out_of_range": nearest is not None,
                "nearest_km": round(nearest_km, 1) if nearest_km is not None else None,
                "nearest_name": nearest.get("name") if nearest else None,
                "reason": (
                    f"Nothing available within {max_km:.0f} km. "
                    f"The closest is {nearest['name']} at {nearest_km:.0f} km."
                    if nearest
                    else f"Nothing available within {max_km:.0f} km of this report."
                ),
            }

        cur.execute(
            "update resources set status = 'dispatched' where id = %s and status = 'available'",
            (chosen["id"],),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=409, detail="resource was just dispatched, retry")

        cur.execute(
            "update reports set status = 'assigned', assigned_resource_id = %s where id = %s",
            (chosen["id"], body.report_id),
        )
    conn.commit()
    return {
        "assigned": True,
        "resource_id": str(chosen["id"]),
        "resource_name": chosen.get("name"),
        "distance_km": round(distance_km, 2) if distance_km is not None else None,
    }
