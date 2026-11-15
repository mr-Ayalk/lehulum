# FR-DEAF-05, INT-05: Phrase clips. Lesson lines use memory clips. Stock phrases use phrases/.
import csv

from fastapi import APIRouter

from api.store import demo_dir

router = APIRouter()


@router.get("/api/v1/phrases")
def list_phrases():
    path = demo_dir() / "phrases.csv"
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    items = []
    for row in rows:
        clip = "memory/" + row["id"] + ".mp4" if row["id"].startswith("A") else "phrases/" + row["id"] + ".mp4"
        items.append({"id": row["id"], "am": row["text_am"], "en": row["text_en"], "clip": clip})
    return items
