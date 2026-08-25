from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection
from pydantic import BaseModel
from app.db import get_conn
from app.deps import require_authority
from app.allocator import pick_nearest_available

router = APIRouter(tags=["allocate"])


class AllocateBody(BaseModel):
    report_id: str
    resource_type: str | None = None


@router.post("/allocate")
def allocate(
    body: AllocateBody,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(require_authority),
):
    with conn.cursor() as cur:
        cur.execute("select id, lat, lng, status from reports where id = %s", (body.report_id,))
        report = cur.fetchone()
        if not report:
            raise HTTPException(status_code=404, detail="report not found")
        if report["status"] != "open":
            raise HTTPException(status_code=409, detail=f"report is already {report['status']}")

        cur.execute("select id, type, lat, lng, status from resources")
        resources = cur.fetchall()

        chosen = pick_nearest_available(report, resources, body.resource_type)
        if not chosen:
            return {"assigned": False, "reason": "no available resource in range"}

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
    return {"assigned": True, "resource_id": str(chosen["id"])}
