# FR-CORE-02, INT-05, FR-STU-01: Upload a lesson and read its caption job.
import json
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from api.pipeline.job import lesson_dir, public_lesson, run_lesson, write_state

router = APIRouter()
FILES = {"lesson.am.vtt", "lesson.en.vtt", "captions.json", "manifest.json", "video.mp4", "status.json"}


def _fail(status, message):
    return JSONResponse({"error": message}, status_code=status)


@router.post("/api/v1/lessons")
async def create_lesson(
    background: BackgroundTasks,
    video: UploadFile = File(...),
    title: str = Form(...),
    lang: str = Form(...),
    script: str = Form(""),
    script_file: Optional[UploadFile] = File(None),
):
    if lang not in ("am", "en"):
        return _fail(400, "Language must be am or en.")
    payload = await video.read()
    if not payload:
        return _fail(400, "Choose a video file.")
    text = script or ""
    if script_file is not None and script_file.filename:
        text = (await script_file.read()).decode("utf-8")
    lesson_id = uuid4().hex[:12]
    folder = lesson_dir(lesson_id)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "video.mp4").write_bytes(payload)
    if text.strip():
        (folder / "script.txt").write_text(text, encoding="utf-8")
    meta = {"id": lesson_id, "title": title.strip() or "Untitled", "lang": lang}
    (folder / "meta.json").write_text(json.dumps(meta, ensure_ascii=False) + "\n", encoding="utf-8")
    write_state(folder, "queued")
    background.add_task(run_lesson, lesson_id)
    return JSONResponse({"id": lesson_id}, status_code=201)


@router.get("/api/v1/lessons/{lesson_id}")
def read_lesson(lesson_id: str):
    body = public_lesson(lesson_id)
    if body is None:
        return _fail(404, "No lesson with that id.")
    return body


@router.get("/api/v1/lessons/{lesson_id}/files/{name}")
def read_file(lesson_id: str, name: str):
    if name not in FILES:
        return _fail(404, "That file is not part of the lesson.")
    path = lesson_dir(lesson_id) / name
    if not path.is_file():
        return _fail(404, "That file is not ready yet.")
    media = "text/vtt" if name.endswith(".vtt") else "application/json"
    if name.endswith(".mp4"):
        media = "video/mp4"
    return FileResponse(path, media_type=media)
