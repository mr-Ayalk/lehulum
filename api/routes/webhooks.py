# INT-06: The host registers an address. The server posts lesson.completed there.
import json
import urllib.request

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.store import read_list, write_list

router = APIRouter()


@router.post("/api/v1/webhooks")
def add_hook(body: dict):
    url = (body.get("url") or "").strip()
    if not url.startswith("http"):
        return JSONResponse({"error": "Give an http address."}, status_code=400)
    rows = read_list("webhooks.json")
    rows.append({"url": url, "event": "lesson.completed"})
    write_list("webhooks.json", rows)
    return JSONResponse({"id": len(rows)}, status_code=201)


@router.get("/api/v1/webhooks")
def list_hooks():
    return read_list("webhooks.json")


def notify(event, payload):
    body = json.dumps({"event": event, **payload}).encode()
    for row in read_list("webhooks.json"):
        if row.get("event") != event or not str(row.get("url", "")).startswith("http"):
            continue
        request = urllib.request.Request(row["url"], data=body, headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(request, timeout=2)
        except (OSError, ValueError):
            continue
