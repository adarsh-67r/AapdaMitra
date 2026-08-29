"""
Route-level guards for the SMS gateway endpoint.

The connection is overridden away: these cases are decided before any query
runs, and the point is that they still are.
"""

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import get_conn
from app.main import app


@pytest.fixture
def client():
    app.dependency_overrides[get_conn] = lambda: None
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_a_request_without_the_shared_secret_is_refused(client):
    response = client.post(
        "/sms/inbound", json={"from": "+919876543210", "body": "AM 3 23.2,69.6 flood"}
    )
    assert response.status_code == 401


def test_the_endpoint_refuses_everything_while_the_secret_is_unset(client, monkeypatch):
    # Open to the internet by necessity. An unconfigured deployment must be shut,
    # not open — an empty expected key matching an empty supplied one would let
    # anyone file reports as anyone.
    monkeypatch.setattr(settings, "sms_inbound_key", "")
    response = client.post(
        "/sms/inbound",
        json={"from": "+919876543210", "body": "AM 3 23.2,69.6 flood"},
        headers={"X-SMS-Key": ""},
    )
    assert response.status_code == 401


def test_a_message_that_is_not_a_report_is_accepted_and_ignored(client, monkeypatch):
    # The gateway forwards every message the SIM receives. A wrong number must
    # not look to it like a broken endpoint worth retrying.
    monkeypatch.setattr(settings, "sms_inbound_key", "test-key")
    response = client.post(
        "/sms/inbound",
        json={"from": "+919876543210", "body": "hey are you free tomorrow"},
        headers={"X-SMS-Key": "test-key"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ignored"
