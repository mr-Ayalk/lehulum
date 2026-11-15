# INT-05: Small JSON files for progress, jobs applications, and certificates.
import json
from pathlib import Path

from api.settings import data_dir


def _path(name):
    folder = data_dir()
    folder.mkdir(parents=True, exist_ok=True)
    return folder / name


def read_list(name):
    path = _path(name)
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def write_list(name, rows):
    _path(name).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def demo_dir():
    import os
    chosen = os.environ.get("DEMO_DIR", "").strip()
    if chosen:
        return Path(chosen)
    local = Path(__file__).resolve().parents[1] / "demo" / "data"
    if local.exists():
        return local
    return Path("/demo/data")
