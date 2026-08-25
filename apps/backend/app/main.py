from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import alerts, allocate, auth, reports, resources

app = FastAPI(title="AapdaMitra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(resources.router)
app.include_router(alerts.router)
app.include_router(allocate.router)


@app.get("/health")
def health():
    return {"status": "ok"}
