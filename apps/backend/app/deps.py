from fastapi import Depends, Header, HTTPException
from jose import JWTError
from app.auth_core import decode_token


def get_current_user(authorization: str = Header(default="")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        return decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid or expired token")


def require_authority(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "authority":
        raise HTTPException(status_code=403, detail="authority role required")
    return user
