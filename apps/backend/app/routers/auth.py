from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection
from pydantic import BaseModel, EmailStr
from app.auth_core import hash_password, verify_password, create_token
from app.db import get_conn

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupBody(BaseModel):
    email: EmailStr
    password: str
    role: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def signup(body: SignupBody, conn: Connection = Depends(get_conn)):
    if body.role not in ("citizen", "authority"):
        raise HTTPException(status_code=400, detail="role must be 'citizen' or 'authority'")
    with conn.cursor() as cur:
        cur.execute("select id from auth_users where email = %s", (body.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="email already registered")
        cur.execute(
            "insert into auth_users (email, password_hash, role) values (%s, %s, %s) returning id",
            (body.email, hash_password(body.password), body.role),
        )
        user_id = cur.fetchone()["id"]
    conn.commit()
    token = create_token(user_id=str(user_id), role=body.role)
    return {"token": token, "role": body.role}


@router.post("/login")
def login(body: LoginBody, conn: Connection = Depends(get_conn)):
    with conn.cursor() as cur:
        cur.execute("select id, password_hash, role from auth_users where email = %s", (body.email,))
        row = cur.fetchone()
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="invalid email or password")
    token = create_token(user_id=str(row["id"]), role=row["role"])
    return {"token": token, "role": row["role"]}


import secrets
from datetime import datetime, timedelta, timezone
from app.email import send_reset_email
from app.config import settings


class RequestResetBody(BaseModel):
    email: EmailStr


class ResetPasswordBody(BaseModel):
    token: str
    new_password: str


@router.post("/request-password-reset")
def request_password_reset(body: RequestResetBody, conn: Connection = Depends(get_conn)):
    with conn.cursor() as cur:
        cur.execute("select id from auth_users where email = %s", (body.email,))
        row = cur.fetchone()
        if row:
            token = secrets.token_urlsafe(32)
            expires = datetime.now(timezone.utc) + timedelta(minutes=settings.reset_token_ttl_minutes)
            cur.execute(
                "update auth_users set reset_token = %s, reset_token_expires = %s where id = %s",
                (token, expires, row["id"]),
            )
            conn.commit()
            reset_link = f"https://aapdamitra.example.com/reset-password?token={token}"
            send_reset_email(body.email, reset_link)
    # Always return success, regardless of whether the email exists — avoids
    # leaking which emails are registered.
    return {"message": "if that email is registered, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody, conn: Connection = Depends(get_conn)):
    with conn.cursor() as cur:
        cur.execute(
            "select id, reset_token_expires from auth_users where reset_token = %s",
            (body.token,),
        )
        row = cur.fetchone()
        if not row or row["reset_token_expires"] < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="invalid or expired reset token")
        cur.execute(
            "update auth_users set password_hash = %s, reset_token = null, reset_token_expires = null where id = %s",
            (hash_password(body.new_password), row["id"]),
        )
    conn.commit()
    return {"message": "password updated"}
