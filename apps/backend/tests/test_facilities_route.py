"""
Route-level guards for the facility layer.

The connection is overridden away: every case here is decided before any query
runs, and the point is that they still are — a refused query must never reach
the database.
"""

import pytest
from fastapi.testclient import TestClient

from app.db import get_conn
from app.deps import get_current_user
from app.main import app

CHENNAI = {"south": 13.02, "west": 80.20, "north": 13.09, "east": 80.28}


@pytest.fixture
def client():
    app.dependency_overrides[get_conn] = lambda: None
    app.dependency_overrides[get_current_user] = lambda: {"sub": "u1", "role": "citizen"}
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def anonymous():
    app.dependency_overrides[get_conn] = lambda: None
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_a_signed_out_caller_is_refused(anonymous):
    response = anonymous.get("/facilities", params={**CHENNAI, "kinds": "hospital"})
    assert response.status_code == 401


def test_a_view_wider_than_the_cap_is_refused(client):
    # The server's own copy of the zoom-11 gate. A client that stops respecting
    # it must not become the database's problem.
    response = client.get(
        "/facilities",
        params={"south": 8.0, "west": 68.0, "north": 30.0, "east": 90.0, "kinds": "hospital"},
    )
    assert response.status_code == 400


def test_an_unknown_kind_is_refused(client):
    response = client.get("/facilities", params={**CHENNAI, "kinds": "hospital,school"})
    assert response.status_code == 400


def test_a_request_with_no_kinds_is_refused(client):
    response = client.get("/facilities", params={**CHENNAI, "kinds": ""})
    assert response.status_code == 400


def test_a_missing_corner_is_refused(client):
    response = client.get(
        "/facilities", params={"south": 13.02, "west": 80.20, "kinds": "hospital"}
    )
    assert response.status_code == 422
