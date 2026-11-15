# FR-NET-14, INT-05: Accept progress events and ignore a repeated id.
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.routes.webhooks import notify
from api.store import read_list, write_list

router = APIRouter()


@router.post("/api/v1/progress")
def add_progress(body: dict):
    if not body.get("event_id") or not body.get("lesson_id"):
        return JSONResponse({"error": "event_id and lesson_id are required."}, status_code=400)
    rows = read_list("progress.json")
    if any(row.get("event_id") == body["event_id"] for row in rows):
        return {"stored": False}
    rows.append({
        "event_id": body["event_id"],
        "lesson_id": body["lesson_id"],
        "learner_ref": body.get("learner_ref") or "learner-demo",
        "kind": body.get("kind") or "progress",
        "position_s": body.get("seconds") or body.get("position_s") or 0,
        "at": body.get("at") or "",
    })
    write_list("progress.json", rows)
    if rows[-1]["kind"] == "complete":
        notify("lesson.completed", {"lesson_id": rows[-1]["lesson_id"]})
    return JSONResponse({"stored": True}, status_code=201)


@router.get("/api/v1/progress/{learner_ref}/{lesson_id}")
def read_progress(learner_ref: str, lesson_id: str):
    rows = [row for row in read_list("progress.json") if row["learner_ref"] == learner_ref and row["lesson_id"] == lesson_id]
    furthest = max((row["position_s"] for row in rows), default=0)
    return {"learner_ref": learner_ref, "lesson_id": lesson_id, "position_s": furthest, "completed": any(row["kind"] == "complete" for row in rows)}
