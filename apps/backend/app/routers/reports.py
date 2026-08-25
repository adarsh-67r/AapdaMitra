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


@router.post("")
def create_report(
    body: CreateReportBody,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(get_current_user),
):
    with conn.cursor() as cur:
        cur.execute(
            """insert into reports (citizen_id, lat, lng, severity, description, photo_url)
               values (%s, %s, %s, %s, %s, %s) returning *""",
            (user["user_id"], body.lat, body.lng, body.severity, body.description, body.photo_url),
        )
        row = cur.fetchone()
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
        cur.execute(f"update reports set {', '.join(fields)} where id = %s returning *", values)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="report not found")
    conn.commit()
    return row


@router.post("/{report_id}/photo")
async def upload_photo(
    report_id: str,
    file: UploadFile,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(get_current_user),
):
    contents = await file.read()
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
