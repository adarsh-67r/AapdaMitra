import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
from psycopg import Connection
from pydantic import BaseModel, Field

from app.auth_core import hash_password
from app.config import settings
from app.db import get_conn
from app.routers.reports import insert_report
from app.sms import parse_sms_report, resolve_position

router = APIRouter(prefix="/sms", tags=["sms"])


class InboundSmsBody(BaseModel):
    # Named to match the field every SMS provider posts, so an adapter for a
    # bought number is a rename and nothing more.
    sender: str = Field(alias="from")
    body: str

    model_config = {"populate_by_name": True}


def find_or_create_citizen(cur, phone: str) -> str:
    """
    The account behind a phone number, created on first contact.

    auth_users is keyed by email, which someone reporting by text has never
    given us, so an SMS-only citizen gets a synthetic one and a password nobody
    holds — the row exists to own their reports, not to be signed into. If they
    later sign up properly the two accounts stay separate, which is the honest
    outcome: nothing here proves the same person owns both.
    """
    cur.execute("select id from auth_users where phone = %s", (phone,))
    row = cur.fetchone()
    if row:
        return row["id"]

    cur.execute(
        "insert into auth_users (email, password_hash, role, phone) values (%s, %s, %s, %s) returning id",
        (
            f"{phone}@sms.aapdamitra.invalid",
            hash_password(secrets.token_urlsafe(32)),
            "citizen",
            phone,
        ),
    )
    return cur.fetchone()["id"]


def last_known_position(cur, citizen_id: str) -> tuple[float, float] | None:
    cur.execute(
        "select lat, lng from reports where citizen_id = %s order by created_at desc limit 1",
        (citizen_id,),
    )
    row = cur.fetchone()
    return (row["lat"], row["lng"]) if row else None


@router.post("/inbound")
def inbound_sms(
    body: InboundSmsBody,
    conn: Connection = Depends(get_conn),
    x_sms_key: str = Header(default=""),
):
    """
    One text message becomes one report.

    Open to the internet by necessity — the gateway forwarding these has no
    account — so it is guarded by a shared secret, and refuses outright when
    that secret was never configured rather than running unguarded.
    """
    if not settings.sms_inbound_key or not secrets.compare_digest(
        x_sms_key, settings.sms_inbound_key
    ):
        raise HTTPException(status_code=401, detail="unauthorized")

    parsed = parse_sms_report(body.body)
    if parsed is None:
        # Not one of ours. 200, not 4xx: the gateway forwards every message the
        # SIM receives, and a wrong number must not look like a broken gateway.
        return {"status": "ignored", "reason": "not a report"}

    with conn.cursor() as cur:
        citizen_id = find_or_create_citizen(cur, body.sender)
        position = resolve_position(parsed, last_known_position(cur, citizen_id))
        if position is None:
            conn.rollback()
            return {
                "status": "ignored",
                "reason": "no position in the message and none on record for this number",
            }

        lat, lng, location_source = position
        row = insert_report(
            cur,
            citizen_id=citizen_id,
            lat=lat,
            lng=lng,
            severity=parsed.severity,
            description=parsed.description or None,
            location_source=location_source,
        )
    conn.commit()
    return {"status": "filed", "id": str(row["id"]), "location_source": location_source}
