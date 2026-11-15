# FR-JOB-01, FR-JOB-06, INT-07: Test jobs for the career gateway.
import json

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.store import demo_dir, read_list, write_list

router = APIRouter()


def _jobs():
    path = demo_dir() / "jobs.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _one(job_id):
    for job in _jobs():
        if job["id"] == job_id:
            return job
    return None


def _jsonld(job):
    return {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": job["title"]["en"],
        "description": job["description"]["en"],
        "datePosted": job["datePosted"],
        "validThrough": job["validThrough"],
        "employmentType": job["type"],
        "hiringOrganization": {"@type": "Organization", "name": job["org"]},
        "jobLocation": {"@type": "Place", "address": {"@type": "PostalAddress", "addressLocality": job["city"], "addressCountry": "ET"}},
    }


@router.get("/api/v1/jobs")
def list_jobs():
    return _jobs()


@router.get("/api/v1/jobs/{job_id}")
def read_job(job_id: str):
    job = _one(job_id)
    if job is None:
        return JSONResponse({"error": "No job with that id."}, status_code=404)
    return job


@router.get("/api/v1/jobs/{job_id}/jsonld")
def read_jsonld(job_id: str):
    job = _one(job_id)
    if job is None:
        return JSONResponse({"error": "No job with that id."}, status_code=404)
    return _jsonld(job)


@router.post("/api/v1/applications")
def apply(body: dict):
    if not body.get("name") or not body.get("contact") or not body.get("job_id"):
        return JSONResponse({"error": "Name, contact, and job are required."}, status_code=400)
    if _one(body["job_id"]) is None:
        return JSONResponse({"error": "No job with that id."}, status_code=404)
    rows = read_list("applications.json")
    rows.append({"name": body["name"], "contact": body["contact"], "message": body.get("message", ""), "how": body.get("how", "text"), "job_id": body["job_id"]})
    write_list("applications.json", rows)
    return JSONResponse({"id": len(rows)}, status_code=201)
