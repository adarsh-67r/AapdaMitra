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
