from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection
from pydantic import BaseModel
from app.db import get_conn
from app.deps import require_authority
from app.allocator import FAR_DISPATCH_KM, pick_best_resource

router = APIRouter(tags=["allocate"])


class AllocateBody(BaseModel):
    report_id: str
    resource_type: str | None = None
    # Optional bound on the search. Unset means no limit: allocate the nearest
    # available resource however far it is, and report the distance.
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

        chosen, distance_km = pick_best_resource(
            report, resources, body.resource_type, body.max_km
        )
        if not chosen:
            available = sum(1 for r in resources if r["status"] == "available")
            return {
                "assigned": False,
                "out_of_range": False,
                "reason": (
                    "No resource is currently available. Free one up under Resources."
                    if available == 0
                    else "No resource matches this request."
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
        # Distance is reported, never enforced — a long dispatch is legitimate in
        # a sparsely covered region, but the operator should see that it is long.
        "far": distance_km is not None and distance_km > FAR_DISPATCH_KM,
    }
