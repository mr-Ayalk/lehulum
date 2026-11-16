# FR-BLV-01, FR-BLV-05, FR-BLV-06: Rename a chapter and edit a description a person checked.
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from api.pipeline.describe import find_moments
from api.pipeline.vttio import load, replace_text
from api.settings import data_dir
from api.store import demo_dir

router = APIRouter()


def _folder(lesson_id):
    uploaded = data_dir() / "lessons" / lesson_id
    if uploaded.is_dir():
        return uploaded
    if lesson_id == "python-01" and demo_dir().is_dir():
        return demo_dir()
    return None


def _missing():
    return JSONResponse({"error": "No lesson with that id."}, status_code=404)


@router.post("/api/v1/lessons/{lesson_id}/chapters")
def rename_chapter(lesson_id: str, body: dict = Body(...)):
    folder = _folder(lesson_id)
    title = (body.get("title") or "").strip()
    cue_id = (body.get("id") or "").strip()
    if folder is None:
        return _missing()
    if not cue_id or not title:
        return JSONResponse({"error": "A chapter id and title are required."}, status_code=400)
    if not replace_text(folder / "chapters.vtt", cue_id, title):
        return JSONResponse({"error": "No chapter with that id."}, status_code=404)
    return {"id": cue_id, "title": title}


@router.get("/api/v1/lessons/{lesson_id}/moments")
def moments(lesson_id: str):
    folder = _folder(lesson_id)
    if folder is None:
        return _missing()
    cues = load(folder / "lesson.am.vtt") + load(folder / "lesson.en.vtt")
    starts = [cue["start"] for cue in load(folder / "chapters.vtt")]
    am = {cue["id"]: cue for cue in load(folder / "descriptions.am.vtt") if cue.get("id")}
    en = {cue["id"]: cue for cue in load(folder / "descriptions.en.vtt") if cue.get("id")}
    rows = []
    for cue_id in list(am) + [key for key in en if key not in am]:
        row = am.get(cue_id) or en.get(cue_id)
        rows.append({"id": cue_id, "start": row["start"], "am": am.get(cue_id, {}).get("text", ""), "en": en.get(cue_id, {}).get("text", "")})
    return {"moments": find_moments(cues, starts), "descriptions": rows}


@router.post("/api/v1/lessons/{lesson_id}/descriptions")
def save_description(lesson_id: str, body: dict = Body(...)):
    folder = _folder(lesson_id)
    cue_id = (body.get("id") or "").strip()
    lang = body.get("lang")
    text = (body.get("text") or "").strip()
    if folder is None:
        return _missing()
    if lang not in ("am", "en") or not cue_id or not text:
        return JSONResponse({"error": "Id, language, and text are required."}, status_code=400)
    if not replace_text(folder / f"descriptions.{lang}.vtt", cue_id, text):
        return JSONResponse({"error": "No description with that id."}, status_code=404)
    return {"id": cue_id, "lang": lang}
