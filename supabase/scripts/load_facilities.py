"""
Fills the facilities table from the cell files the web map is served from.

    apps/backend/.venv/Scripts/python supabase/scripts/load_facilities.py

Reads DATABASE_URL from apps/backend/.env, the same connection the API uses.
Run after 007_facilities.sql, and again whenever build-facility-index.js is
re-run — the table is emptied first, so this is safe to repeat and the row count
never drifts from the files.

Written in Python rather than Node like its neighbours because psycopg is
already a backend dependency and nothing here has a Postgres driver for Node.
COPY rather than 58,232 inserts: seconds against a hosted database instead of
minutes.
"""

import csv
import io
import json
import os
import pathlib
import sys

import psycopg

ROOT = pathlib.Path(__file__).resolve().parents[2]
CELL_DIR = ROOT / "apps" / "web" / "public" / "facilities"
ENV_PATH = ROOT / "apps" / "backend" / ".env"


def database_url() -> str:
    """DATABASE_URL from the environment, falling back to the backend's .env."""
    url = os.environ.get("DATABASE_URL")
    if url:
        return url

    if not ENV_PATH.exists():
        sys.exit(f"no DATABASE_URL in the environment and no {ENV_PATH}")

    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")

    sys.exit(f"no DATABASE_URL in {ENV_PATH}")


def rows():
    """Every [kind, lat, lng, name] tuple across the cells, cell by cell."""
    index = json.loads((CELL_DIR / "index.json").read_text(encoding="utf-8"))
    for key in index["cells"]:
        for row in json.loads((CELL_DIR / f"{key}.json").read_text(encoding="utf-8")):
            yield row


def main() -> None:
    if not CELL_DIR.exists():
        sys.exit(f"no cell files at {CELL_DIR} — run build-facility-index.js first")

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    count = 0
    for kind, lat, lng, name in rows():
        writer.writerow([kind, lat, lng, name])
        count += 1
    buffer.seek(0)

    with psycopg.connect(database_url()) as conn:
        with conn.cursor() as cur:
            # Emptied rather than upserted: these rows have no identity of their
            # own beyond what the build produced, so the file is the truth and
            # the table is a copy of it.
            cur.execute("truncate facilities restart identity")
            with cur.copy(
                "copy facilities (kind, lat, lng, name) from stdin with (format csv)"
            ) as copy:
                copy.write(buffer.read())

            cur.execute("select count(*) as n from facilities")
            loaded = cur.fetchone()[0]
        conn.commit()

    print(f"{count} rows read from {CELL_DIR.name}, {loaded} in the table")
    if loaded != count:
        sys.exit("row counts disagree — nothing was committed to be trusted")


if __name__ == "__main__":
    main()
