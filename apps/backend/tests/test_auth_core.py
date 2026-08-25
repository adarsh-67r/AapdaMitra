import pytest
from jose import JWTError
from app.auth_core import hash_password, verify_password, create_token, decode_token


def test_hash_and_verify_roundtrip():
    hashed = hash_password("correct horse battery staple")
    assert verify_password("correct horse battery staple", hashed)
    assert not verify_password("wrong password", hashed)


def test_hash_is_not_plaintext():
    hashed = hash_password("my-password")
    assert hashed != "my-password"


def test_token_roundtrip():
    token = create_token(user_id="abc-123", role="authority")
    decoded = decode_token(token)
    assert decoded["user_id"] == "abc-123"
    assert decoded["role"] == "authority"


def test_invalid_token_raises():
    with pytest.raises(JWTError):
        decode_token("not-a-real-token")
