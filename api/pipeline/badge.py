# FR-CERT-01, FR-CERT-04, INT-08: Open Badges 3.0 signed with Ed25519 (eddsa-jcs-2022).
import base64
import hashlib
import json
import os
import uuid
from datetime import datetime, timezone

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from api.settings import data_dir

_ALPH = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def _b58(raw):
    zeros = len(raw) - len(raw.lstrip(b"\x00"))
    number = int.from_bytes(raw, "big")
    chars = []
    while number:
        number, rem = divmod(number, 58)
        chars.append(_ALPH[rem])
    return "1" * zeros + "".join(reversed(chars or ["1"]))


def _b58d(text):
    number = 0
    for ch in text:
        number = number * 58 + _ALPH.index(ch)
    raw = number.to_bytes(max((number.bit_length() + 7) // 8, 1), "big")
    pad = len(text) - len(text.lstrip("1"))
    if number == 0:
        raw = b""
    return b"\x00" * pad + raw


def jcs(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _seed():
    chosen = os.environ.get("CERT_ED25519_SEED", "").strip()
    if chosen:
        raw = base64.b64decode(chosen)
        if len(raw) != 32:
            raise ValueError("CERT_ED25519_SEED must be 32 bytes in base64.")
        return raw
    path = data_dir() / "ed25519.seed"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        return path.read_bytes()
    raw = os.urandom(32)
    path.write_bytes(raw)
    return raw


def _private():
    return Ed25519PrivateKey.from_private_bytes(_seed())


def issuer_did():
    public = _private().public_key().public_bytes_raw()
    ident = "z" + _b58(b"\xed\x01" + public)
    return "did:key:" + ident


def _sign(document):
    did = issuer_did()
    proof = {
        "type": "DataIntegrityProof",
        "cryptosuite": "eddsa-jcs-2022",
        "created": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "verificationMethod": did + "#" + did.split(":", 2)[-1],
        "proofPurpose": "assertionMethod",
    }
    material = hashlib.sha256(jcs(proof)).digest() + hashlib.sha256(jcs(document)).digest()
    proof["proofValue"] = "z" + _b58(_private().sign(material))
    signed = dict(document)
    signed["proof"] = proof
    return signed


def issue_credential(lesson_id, learner_ref):
    did = issuer_did()
    document = {
        "@context": [
            "https://www.w3.org/ns/credentials/v2",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        ],
        "id": "urn:uuid:" + uuid.uuid4().hex,
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "issuer": {"id": did, "type": ["Profile"], "name": "LE HULUM"},
        "validFrom": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "name": "Python: your first variable",
        "credentialSubject": {
            "id": "urn:lehulum:learner:" + learner_ref,
            "type": ["AchievementSubject"],
            "achievement": {
                "id": "urn:lehulum:lesson:" + lesson_id,
                "type": ["Achievement"],
                "name": "Python: your first variable",
                "description": "ፓይተን፡ የመጀመሪያ ተለዋዋጭ",
                "criteria": {"narrative": "The learner finished this lesson."},
            },
        },
    }
    return _sign(document)


def check_credential(credential):
    if not isinstance(credential, dict) or "proof" not in credential:
        return None, "That certificate cannot be read."
    proof = dict(credential["proof"])
    value = proof.pop("proofValue", "")
    document = {key: item for key, item in credential.items() if key != "proof"}
    try:
        signature = _b58d(value[1:] if value.startswith("z") else value)
        material = hashlib.sha256(jcs(proof)).digest() + hashlib.sha256(jcs(document)).digest()
        public = _private().public_key()
        public.verify(signature, material)
    except Exception:
        return None, "The signature does not match."
    if proof.get("verificationMethod", "").split("#")[0] != issuer_did():
        return None, "The signature does not match."
    return document, ""
