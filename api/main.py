# INT-05: FastAPI application. Health check and lesson upload.
from fastapi import FastAPI

from api.routes.certificates import router as certificates
from api.routes.documents import router as documents
from api.routes.glossary import router as glossary
from api.routes.jobs import router as jobs
from api.routes.lessons import router as lessons
from api.routes.lexicon import router as lexicon
from api.routes.phrases import router as phrases
from api.routes.packs import router as packs
from api.routes.progress import router as progress
from api.routes.sign import router as sign
from api.routes.webhooks import router as webhooks

app = FastAPI(
    title="LE HULUM",
    version="0.0.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)
for router in (lessons, jobs, documents, certificates, progress, sign, webhooks, glossary, lexicon, phrases, packs):
    app.include_router(router)


@app.api_route("/api/v1/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}
