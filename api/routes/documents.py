# FR-DOC-01, FR-DOC-02, FR-DOC-03: Download the sample lesson as HTML, PDF, or braille.
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, Response

from api.pipeline.docs import lesson_brf, lesson_html, lesson_pdf

router = APIRouter()


@router.get("/api/v1/lessons/{lesson_id}/document.html", response_class=HTMLResponse)
def document_html(lesson_id: str):
    return lesson_html()


@router.get("/api/v1/lessons/{lesson_id}/document.pdf")
def document_pdf(lesson_id: str):
    return Response(lesson_pdf(), media_type="application/pdf")


@router.get("/api/v1/lessons/{lesson_id}/document.brf")
def document_brf(lesson_id: str):
    return Response(lesson_brf(), media_type="text/plain", headers={"X-Braille-Note": "Ethiopic grade 1 and English uncontracted."})
