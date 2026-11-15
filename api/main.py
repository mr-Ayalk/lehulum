# INT-05: FastAPI application. Health check and lesson upload.
from fastapi import FastAPI

from api.routes.lessons import router

app = FastAPI(
    title="LE HULUM",
    version="0.0.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)
app.include_router(router)


@app.api_route("/api/v1/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}
