import httpx
from app.config import settings

RESEND_URL = "https://api.resend.com/emails"


def send_reset_email(to: str, reset_link: str) -> None:
    httpx.post(
        RESEND_URL,
        headers={"Authorization": f"Bearer {settings.resend_api_key}"},
        json={
            "from": "AapdaMitra <onboarding@resend.dev>",
            "to": [to],
            "subject": "Reset your AapdaMitra password",
            "html": f"<p>Click below to reset your password. This link expires in {settings.reset_token_ttl_minutes} minutes.</p><p><a href=\"{reset_link}\">{reset_link}</a></p>",
        },
        timeout=10,
    )
