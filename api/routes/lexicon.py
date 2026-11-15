# FR-DEAF-04, INT-05: Word-sign clips shipped with the sample lesson.
from fastapi import APIRouter

from api.store import demo_dir

router = APIRouter()


@router.get("/api/v1/lexicon")
def list_clips():
    folder = demo_dir() / "lexicon"
    if not folder.exists():
        return []
    return [{"id": path.stem, "clip": "lexicon/" + path.name} for path in sorted(folder.glob("*.mp4"))]
