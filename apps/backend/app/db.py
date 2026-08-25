from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from app.config import settings

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            settings.database_url, min_size=1, max_size=5, open=True, kwargs={"row_factory": dict_row}
        )
    return _pool


def get_conn():
    with get_pool().connection() as conn:
        yield conn
