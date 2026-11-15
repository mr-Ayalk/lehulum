# FR-SL-01, FR-SL-07, FR-SL-12, INT-05: Match a line to glossary clips. Labelled as machine output.
import json

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.store import demo_dir

router = APIRouter()


def _terms():
    path = demo_dir() / "glossary.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8")).get("terms", [])


def _match(text):
    source = text or ""
    forms = []
    for term in _terms():
        for form in [term.get("am"), *(term.get("forms_am") or []), term.get("en"), *(term.get("forms_en") or [])]:
            if form:
                forms.append((form, term))
    forms.sort(key=lambda item: len(item[0]), reverse=True)
    taken = [False] * len(source)
    hits = []
    folded = source.lower()
    for form, term in forms:
        needle = form.lower()
        start = 0
        while True:
            at = folded.find(needle, start)
            if at < 0:
                break
            end = at + len(needle)
            latin = all(ord(ch) < 128 for ch in form)
            before = at == 0 or not source[at - 1].isalpha()
            after = end >= len(source) or not source[end].isalpha()
            if not any(taken[at:end]) and (not latin or (before and after)):
                for index in range(at, end):
                    taken[index] = True
                hits.append((at, term))
                start = end
            else:
                start = at + 1
    hits.sort(key=lambda item: item[0])
    return [{
        "id": term.get("id"),
        "am": term.get("am") or "",
        "en": term.get("en") or "",
        "clip": term.get("sign") or "",
        "labelled": "machine",
    } for _, term in hits]


@router.post("/api/v1/sign/translate")
def translate(body: dict):
    text = (body.get("text") or "").strip()
    if not text:
        return JSONResponse({"error": "Text is required."}, status_code=400)
    clips = _match(text)
    return {"gloss": [item["id"] for item in clips], "clips": clips, "labelled": "machine"}
