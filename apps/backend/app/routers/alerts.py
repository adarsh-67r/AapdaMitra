import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from psycopg import Connection
from pydantic import BaseModel
from app.db import get_conn
from app.deps import get_current_user, require_authority
from app.sachet import SACHET_URL, parse_centroid, parse_sachet_time, dedupe_preferring_english
from app.config import settings

router = APIRouter(tags=["alerts"])


class BroadcastAlertBody(BaseModel):
    disaster_type: str
    severity_color: str
    area_description: str
    warning_message: str
    lat: float
    lng: float


@router.get("/alerts")
def list_alerts(conn: Connection = Depends(get_conn), user: dict = Depends(get_current_user)):
    with conn.cursor() as cur:
        cur.execute("select * from alerts order by fetched_at desc limit 200")
        return cur.fetchall()


@router.post("/alerts")
def broadcast_alert(
    body: BroadcastAlertBody,
    conn: Connection = Depends(get_conn),
    user: dict = Depends(require_authority),
):
    with conn.cursor() as cur:
        cur.execute(
            """insert into alerts (external_id, disaster_type, area_description, severity_color,
                                    warning_message, source, lat, lng)
               values (gen_random_uuid()::text, %s, %s, %s, %s, 'authority_advisory', %s, %s)
               returning *""",
            (body.disaster_type, body.area_description, body.severity_color, body.warning_message, body.lat, body.lng),
        )
        row = cur.fetchone()
    conn.commit()
    return row


@router.post("/internal/ingest-alerts")
def ingest_alerts(
    conn: Connection = Depends(get_conn),
    authorization: str = Header(default=""),
):
    expected = f"Bearer {settings.ingest_secret}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="unauthorized")

    resp = httpx.get(SACHET_URL, timeout=15)
    if resp.status_code >= 300:
        raise HTTPException(status_code=502, detail=f"SACHET fetch failed: {resp.status_code}")
    raw = resp.json()
    if not isinstance(raw, list):
        return {"upserted": 0, "skipped": 0, "total": 0}

    deduped = dedupe_preferring_english(raw)
    rows = []
    skipped = 0
    for a in deduped:
        try:
            geo = parse_centroid(a["centroid"])
            if not geo:
                skipped += 1
                continue
            rows.append((
                str(a["identifier"]), a["disaster_type"], a["area_description"], a["severity_color"],
                a["severity_level"], a["warning_message"], "sachet_ndma",
                # The agency that actually issued the alert (IMD regional centres,
                # CWC, state SDMAs). `source` stays the ingestion channel.
                a.get("alert_source"), a.get("actual_lang"), geo["lat"], geo["lng"],
                parse_sachet_time(a["effective_start_time"]), parse_sachet_time(a["effective_end_time"]),
            ))
        except (KeyError, TypeError):
            skipped += 1
            continue

    if rows:
        with conn.cursor() as cur:
            cur.executemany(
                """insert into alerts (external_id, disaster_type, area_description, severity_color,
                                        severity_level, warning_message, source, issuing_agency, language,
                                        lat, lng, effective_start, effective_end, fetched_at)
                   values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
                   on conflict (external_id) do update set
                     disaster_type = excluded.disaster_type,
                     area_description = excluded.area_description,
                     severity_color = excluded.severity_color,
                     severity_level = excluded.severity_level,
                     warning_message = excluded.warning_message,
                     issuing_agency = excluded.issuing_agency,
                     language = excluded.language,
                     lat = excluded.lat,
                     lng = excluded.lng,
                     effective_start = excluded.effective_start,
                     effective_end = excluded.effective_end,
                     fetched_at = now()""",
                rows,
            )
        conn.commit()

    return {"upserted": len(rows), "skipped": skipped, "total": len(raw)}
