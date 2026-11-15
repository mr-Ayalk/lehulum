# NFR-QA-01, FR-STU-01, INT-05: A script with no ASR still becomes 14 cues.
import csv
from pathlib import Path

from fastapi.testclient import TestClient

from api.main import app

LESSON = Path(__file__).resolve().parents[2] / "demo" / "data" / "lesson.mp4"
PHRASES = Path(__file__).resolve().parents[2] / "demo" / "data" / "phrases.csv"


def _script():
    lines = []
    with PHRASES.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if row["id"].startswith("A"):
                lines.append(row["text_am"])
    return "\n".join(lines[:14])


def test_script_without_asr_makes_14_cues(data_root):
    client = TestClient(app)
    with LESSON.open("rb") as video:
        response = client.post(
            "/api/v1/lessons",
            data={"title": "Variables", "lang": "am", "script": _script()},
            files={"video": ("lesson.mp4", video, "video/mp4")},
        )
    assert response.status_code == 201
    lesson_id = response.json()["id"]
    body = client.get(f"/api/v1/lessons/{lesson_id}").json()
    if body["status"] == "queued":
        from api.pipeline.job import run_lesson
        run_lesson(lesson_id)
        body = client.get(f"/api/v1/lessons/{lesson_id}").json()
    assert body["status"] == "done", body.get("message")
    track = body["tracks"]["am"]
    vtt = client.get(track).text
    assert vtt.startswith("WEBVTT")
    assert sum(1 for line in vtt.splitlines() if "-->" in line) == 14
    assert "<v Teacher>" in vtt
    saved = data_root / "lessons" / lesson_id / "captions.json"
    assert '"status": "auto"' in saved.read_text(encoding="utf-8")
