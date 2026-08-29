import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from psycopg import Connection
from pydantic import BaseModel
from app.db import get_conn
from app.deps import get_current_user, require_authority
from app.config import settings

router = APIRouter(prefix="/reports", tags=["reports"])


class CreateReportBody(BaseModel):
    lat: float
    lng: float
    severity: str
    description: str | None = None
    photo_url: str | None = None
    # Where the citizen says they are, in words, when they named it by hand.
    place_label: str | None = None
    # "device" for a real position fix, "manual" for a named place. A manual
    # position is a city or district centroid and must never be read as an
    # address, so the console labels it as approximate wherever it is shown.
    location_source: str = "device"
    # The id the client minted when it queued this report. One incident can
    # reach here twice — by SMS from a phone with no data, then again when the
    # offline queue replays it — and this is what makes the second arrival a
    # no-op instead of a second report.
    client_local_id: str | None = None


class UpdateReportBody(BaseModel):
    status: str | None = None
    assigned_resource_id: str | None = None


@router.get("")
def list_reports(conn: Connection = Depends(get_conn), user: dict = Depends(get_current_user)):
    with conn.cursor() as cur:
        if user["role"] == "authority":
            cur.execute("select * from reports order by created_at desc")
        else:
            cur.execute(
                "select * from reports where citizen_id = %s order by created_at desc",
                (user["user_id"],),
            )
        return cur.fetchall()


# Several citizens reporting from the same area within a short window is one
# developing incident, not N unrelated reports. A new report joins the cluster of
# any recent unresolved report nearby; otherwise it starts its own.
CLUSTER_RADIUS_KM = 2.0
CLUSTER_WINDOW_MINUTES = 30
# Degrees of latitude per km, used only to pre-filter candidate rows cheaply
# before the exact haversine check below.
_DEG_PER_KM = 1.0 / 111.0


def insert_report(
    cur,
    *,
    citizen_id,
    lat: float,
    lng: float,
    severity: str,
    description: str | None,
    photo_url: str | None = None,
    place_label: str | None = None,
    location_source: str = "device",
    client_local_id: str | None = None,
):
    """
    Files one report, joining or starting a cluster.

    Shared with the SMS path so a report that arrives as a text message is
    clustered by exactly the same rules as one from the app. Takes a cursor
    rather than a connection: the caller owns the transaction, because the SMS
    path has a citizen to create in the same one.
    """
    # An incident already filed under this client id is the same incident. The
    # SMS path and the offline queue can both deliver it, and whichever loses
    # the race must not create a second row.
    if client_local_id is not None:
        cur.execute("select * from reports where client_local_id = %s", (client_local_id,))
        existing = cur.fetchone()
        if existing:
            return existing

    # Find a recent nearby report to join. The bounding-box filter is an index-
    # friendly pre-filter; earth_distance-style exactness isn't needed at a 2km
    # radius, so a plain haversine in SQL settles it.
    span = CLUSTER_RADIUS_KM * _DEG_PER_KM
    cur.execute(
        """select cluster_id
             from reports
            where cluster_id is not null
              and status <> 'resolved'
              and created_at > now() - make_interval(mins => %s)
              and lat between %s - %s and %s + %s
              and lng between %s - %s and %s + %s
              and 6371 * acos(
                    least(1, greatest(-1,
                      cos(radians(%s)) * cos(radians(lat)) * cos(radians(lng) - radians(%s))
                      + sin(radians(%s)) * sin(radians(lat))
                    ))
                  ) <= %s
         order by created_at desc
            limit 1""",
        (
            CLUSTER_WINDOW_MINUTES,
            lat, span, lat, span,
            lng, span, lng, span,
            lat, lng, lat,
            CLUSTER_RADIUS_KM,
        ),
    )
    existing = cur.fetchone()
    cluster_id = existing["cluster_id"] if existing else uuid.uuid4()

    cur.execute(
        """insert into reports (citizen_id, lat, lng, severity, description, photo_url, cluster_id, place_label, location_source, client_local_id)
           values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) returning *""",
        (citizen_id, lat, lng, severity, description, photo_url, cluster_id, place_label, location_source, client_local_id),
    )
    row = cur.fetchone()

    # Keep the denormalised size in step for every member of the cluster, so the
    # dashboard can flag a hotspot straight off the report list.
    cur.execute(
        """update reports
              set cluster_size = (select count(*) from reports where cluster_id = %s)
            where cluster_id = %s""",
        (cluster_id, cluster_id),
    )
    cur.execute("select * from reports where id = %s", (row["id"],))
    return cur.fetchone()


@router.post("")
def create_report(
    body: CreateReportBody,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(get_current_user),
):
    with conn.cursor() as cur:
        row = insert_report(
            cur,
            citizen_id=user["user_id"],
            lat=body.lat,
            lng=body.lng,
            severity=body.severity,
            description=body.description,
            photo_url=body.photo_url,
            place_label=body.place_label,
            location_source=body.location_source,
            client_local_id=body.client_local_id,
        )
    conn.commit()
    return row


@router.patch("/{report_id}")
def update_report(
    report_id: str,
    body: UpdateReportBody,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(require_authority),
):
    fields, values = [], []
    if body.status is not None:
        fields.append("status = %s")
        values.append(body.status)
    if body.assigned_resource_id is not None or "assigned_resource_id" in body.model_fields_set:
        fields.append("assigned_resource_id = %s")
        values.append(body.assigned_resource_id)
    if not fields:
        raise HTTPException(status_code=400, detail="no fields to update")
    values.append(report_id)
    with conn.cursor() as cur:
        cur.execute("select assigned_resource_id from reports where id = %s", (report_id,))
        previous = cur.fetchone()
        if not previous:
            raise HTTPException(status_code=404, detail="report not found")

        cur.execute(f"update reports set {', '.join(fields)} where id = %s returning *", values)
        row = cur.fetchone()

        # A dispatched unit stays dispatched until the work it was sent for is
        # over. Without this the pool only ever shrinks: every resolved report
        # left its resource flagged as busy, and allocation eventually reported
        # "nothing available" while every unit sat idle.
        released = previous["assigned_resource_id"]
        if released and (row["status"] == "resolved" or row["assigned_resource_id"] != released):
            cur.execute(
                "update resources set status = 'available' where id = %s and status = 'dispatched'",
                (released,),
            )
    conn.commit()
    return row


@router.post("/{report_id}/photo")
def upload_photo(
    report_id: str,
    file: UploadFile,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(get_current_user),
):
    with conn.cursor() as cur:
        cur.execute("select citizen_id from reports where id = %s", (report_id,))
        report = cur.fetchone()
    if not report:
        raise HTTPException(status_code=404, detail="report not found")
    if user["role"] != "authority" and str(report["citizen_id"]) != user["user_id"]:
        raise HTTPException(status_code=403, detail="not your report")

    contents = file.file.read()
    path = f"{uuid.uuid4()}.jpg"
    upload_url = f"{settings.supabase_url}/storage/v1/object/report-photos/{path}"
    resp = httpx.post(
        upload_url,
        headers={
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
            "Content-Type": "image/jpeg",
        },
        content=contents,
        timeout=30,
    )
    if resp.status_code >= 300:
        raise HTTPException(status_code=502, detail=f"storage upload failed: {resp.text}")
    public_url = f"{settings.supabase_url}/storage/v1/object/public/report-photos/{path}"
    with conn.cursor() as cur:
        cur.execute("update reports set photo_url = %s where id = %s returning *", (public_url, report_id))
        row = cur.fetchone()
    conn.commit()
    return row
