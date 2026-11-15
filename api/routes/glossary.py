# FR-DEAF-09, INT-05: Glossary terms from the sample lesson, plus terms a teacher adds.
import json

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.store import demo_dir, read_list, write_list

router = APIRouter()


def _demo():
    path = demo_dir() / "glossary.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8")).get("terms", [])


@router.get("/api/v1/glossary")
def list_terms():
    return {"terms": _demo() + read_list("glossary-added.json")}


@router.get("/api/v1/glossary/{term_id}")
def read_term(term_id: str):
    for term in _demo() + read_list("glossary-added.json"):
        if term.get("id") == term_id:
            return term
    return JSONResponse({"error": "No term with that id."}, status_code=404)


@router.post("/api/v1/glossary")
def add_term(body: dict):
    if not (body.get("id") or "").strip() or not (body.get("am") or "").strip():
        return JSONResponse({"error": "id and am are required."}, status_code=400)
    row = {
        "id": body["id"].strip(),
        "am": body["am"].strip(),
        "en": (body.get("en") or "").strip(),
        "sign": (body.get("sign") or "").strip(),
        "labelled": "author",
    }
    rows = read_list("glossary-added.json")
    rows.append(row)
    write_list("glossary-added.json", rows)
    return JSONResponse(row, status_code=201)
