# FR-CERT-01, FR-CERT-02, FR-CERT-03, FR-CERT-04, INT-08: Check an Open Badges 3.0 credential.
import json

from fastapi import APIRouter
from fastapi.responses import HTMLResponse, JSONResponse

from api.pipeline.badge import check_credential, issue_credential, issuer_did
from api.store import read_list, write_list

router = APIRouter()


def _store(credential):
    rows = read_list("certificates.json")
    rows.append({"id": credential["id"], "credential": credential, "revoked": False})
    write_list("certificates.json", rows)


def _find(cert_id):
    for row in read_list("certificates.json"):
        if row.get("id") == cert_id or cert_id in row.get("id", ""):
            return row
    return None


@router.get("/api/v1/certificates/issuer")
def issuer():
    return {"id": issuer_did(), "name": "LE HULUM", "cryptosuite": "eddsa-jcs-2022"}


@router.post("/api/v1/certificates")
def issue(body: dict):
    if not body.get("lesson_id"):
        return JSONResponse({"error": "A lesson id is required."}, status_code=400)
    credential = issue_credential(body["lesson_id"], body.get("learner_ref") or "learner-demo")
    _store(credential)
    return JSONResponse({"id": credential["id"], "credential": credential}, status_code=201)


@router.post("/api/v1/certificates/verify")
def verify(body: dict):
    credential = body.get("credential")
    if credential is None and body.get("token"):
        try:
            credential = json.loads(body["token"])
        except json.JSONDecodeError:
            credential = None
    document, reason = check_credential(credential)
    if document is None:
        return {"valid": False, "reason": reason}
    revoked = any(row.get("credential") == credential and row.get("revoked") for row in read_list("certificates.json"))
    if revoked:
        return {"valid": False, "reason": "This certificate was revoked."}
    achievement = document["credentialSubject"]["achievement"]
    return {
        "valid": True,
        "issuer": document["issuer"]["name"],
        "achievement": {"en": achievement["name"], "am": achievement["description"]},
        "issued": document["validFrom"][:10],
        "reason": "",
    }


@router.get("/api/v1/certificates/{cert_id}")
def read_cert(cert_id: str):
    row = _find(cert_id)
    if row is None:
        return JSONResponse({"error": "No certificate with that id."}, status_code=404)
    return {"id": row["id"], "credential": row["credential"]}


@router.get("/api/v1/certificates/{cert_id}/page", response_class=HTMLResponse)
def read_html(cert_id: str):
    row = _find(cert_id)
    if row is None:
        return JSONResponse({"error": "No certificate with that id."}, status_code=404)
    import segno
    name = row["credential"]["credentialSubject"]["achievement"]["name"]
    issued = row["credential"]["validFrom"][:10]
    link = "/demo/verify.html?id=" + row["id"].split(":")[-1]
    qr = segno.make(link, micro=False).svg_inline(scale=4)
    return """<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Certificate</title></head>
<body><h1>LE HULUM</h1><p>{name}</p><p id="when" data-date="{issued}"></p>{qr}
<p><a href="{link}">Check this certificate</a></p>
<script>
const node = document.querySelector("#when");
const date = new Date(node.dataset.date + "T00:00:00Z");
node.textContent = new Intl.DateTimeFormat("en-GB", {{dateStyle:"long", timeZone:"UTC"}}).format(date)
  + " · " + new Intl.DateTimeFormat("am-ET-u-ca-ethiopic", {{dateStyle:"long", timeZone:"UTC"}}).format(date);
</script></body></html>""".format(name=name, issued=issued, qr=qr, link=link)
