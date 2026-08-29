from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    resend_api_key: str
    supabase_url: str
    supabase_service_role_key: str
    ingest_secret: str
    # Shared secret for the SMS gateway. Defaults to empty rather than being
    # required: the deployed API must keep booting when it is unset, and
    # /sms/inbound refuses every request until it is.
    sms_inbound_key: str = ""
    reset_token_ttl_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
