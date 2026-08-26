from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt
from app.config import settings

ALGORITHM = "HS256"
TOKEN_TTL_DAYS = 7

# bcrypt only considers the first 72 bytes of a password; anything beyond that is
# silently ignored by the algorithm, and bcrypt 5.x raises rather than truncate.
# We truncate explicitly so a long passphrase logs in instead of erroring, and so
# hashing and verification always agree on the same bytes.
_MAX_PASSWORD_BYTES = 72


def _encode(password: str) -> bytes:
    return password.encode("utf-8")[:_MAX_PASSWORD_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_encode(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_encode(password), password_hash.encode("utf-8"))
    except ValueError:
        # Malformed/unknown hash in the database — treat as a failed login rather
        # than surfacing a 500.
        return False


def create_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS)
    payload = {"user_id": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    return {"user_id": payload["user_id"], "role": payload["role"]}
