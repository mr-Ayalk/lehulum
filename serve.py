# NFR-SUS-03: Run the lesson site and API on this PC when Docker cannot start.
"""Open http://localhost:8080/demo/"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.environ.setdefault("DATA_DIR", str(ROOT / "data"))
os.environ.setdefault("DEMO_DIR", str(ROOT / "demo" / "data"))
font = ROOT / "module" / "fonts" / "noto-sans-ethiopic-400.woff2"
if font.exists():
    os.environ.setdefault("FONT_ETHIOPIC", str(font))

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.main import app


@app.get("/module/sw.js")
def service_worker():
    return FileResponse(
        ROOT / "module" / "sw.js",
        media_type="application/javascript",
        headers={"Service-Worker-Allowed": "/", "Cache-Control": "no-cache"},
    )


app.mount("/module", StaticFiles(directory=ROOT / "module"), name="module")
app.mount("/demo", StaticFiles(directory=ROOT / "demo", html=True), name="demo")
app.mount("/", StaticFiles(directory=ROOT / "savanna", html=True), name="savanna")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8080)
