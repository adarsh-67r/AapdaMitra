from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection
from pydantic import BaseModel
from app.db import get_conn
from app.deps import get_current_user, require_authority

router = APIRouter(prefix="/resources", tags=["resources"])


class CreateResourceBody(BaseModel):
    type: str
    name: str
    lat: float
    lng: float
    capacity: int
    status: str = "available"


class UpdateResourceBody(BaseModel):
    status: str | None = None
    capacity: int | None = None
    name: str | None = None


@router.get("")
def list_resources(conn: Connection = Depends(get_conn), user: dict = Depends(get_current_user)):
    with conn.cursor() as cur:
        cur.execute("select * from resources")
        return cur.fetchall()


@router.post("")
def create_resource(
    body: CreateResourceBody,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(require_authority),
):
    with conn.cursor() as cur:
        cur.execute(
            """insert into resources (type, name, lat, lng, capacity, status)
               values (%s, %s, %s, %s, %s, %s) returning *""",
            (body.type, body.name, body.lat, body.lng, body.capacity, body.status),
        )
        row = cur.fetchone()
    conn.commit()
    return row


@router.patch("/{resource_id}")
def update_resource(
    resource_id: str,
    body: UpdateResourceBody,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(require_authority),
):
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="no fields to update")
    fields = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [resource_id]
    with conn.cursor() as cur:
        cur.execute(f"update resources set {fields} where id = %s returning *", values)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="resource not found")
    conn.commit()
    return row
