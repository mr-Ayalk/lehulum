# FR-NET-07, FR-NET-12: Text and light packs, with sizes shown before download.
import base64
import subprocess

from fastapi import APIRouter
from fastapi.responses import HTMLResponse, JSONResponse

from api.pipeline.docs import lesson_html
from api.pipeline.renditions import ffmpeg
from api.settings import data_dir
from api.store import demo_dir

router = APIRouter()


def _ensure_audio():
    folder = data_dir() / "packs"
    folder.mkdir(parents=True, exist_ok=True)
    demo_audio = demo_dir() / "lesson-audio.m4a"
    if demo_audio.is_file():
        return demo_audio
    audio = folder / "python-01-audio.m4a"
    video = demo_dir() / "lesson.mp4"
    program = ffmpeg()
    if audio.is_file() or not video.is_file() or not program:
        return audio if audio.is_file() else None
    subprocess.run(
        [program, "-y", "-i", str(video), "-vn", "-c:a", "aac", "-b:a", "40k", "-ac", "1", str(audio)],
        capture_output=True)
    light = folder / "python-01-light.mp4"
    if not light.is_file():
        subprocess.run(
            [program, "-y", "-i", str(video), "-vf", "scale=426:-2", "-c:v", "libx264", "-crf", "32",
             "-preset", "veryfast", "-c:a", "aac", "-b:a", "32k", "-ac", "1", "-movflags", "+faststart", str(light)],
            capture_output=True)
    return audio if audio.is_file() else None


def _bytes(path):
    return path.stat().st_size if path.is_file() else 0


@router.get("/api/v1/lessons/{lesson_id}/packs")
def pack_sizes(lesson_id: str):
    text = len(lesson_html().encode("utf-8"))
    audio = data_dir() / "packs" / "python-01-audio.m4a"
    if not audio.is_file():
        audio = demo_dir() / "lesson-audio.m4a"
    return {
        "text": text,
        "light": text + _bytes(audio),
        "full": _bytes(demo_dir() / "lesson.mp4"),
        "audio": audio.is_file(),
    }


@router.get("/api/v1/lessons/{lesson_id}/offline-pack", response_class=HTMLResponse)
def offline_pack(lesson_id: str, level: str = "text"):
    if level == "full":
        return JSONResponse({"error": "The full video stays a separate file. Ask for text or light."}, status_code=400)
    html = lesson_html()
    if level != "light":
        return html
    audio = _ensure_audio()
    if audio is None:
        return html.replace("</body>", "<p>The light audio is not on this computer yet. The text and the slides are here.</p></body>")
    clip = base64.b64encode(audio.read_bytes()).decode()
    return html.replace("</body>", '<h2>Audio</h2><audio controls src="data:audio/mp4;base64,' + clip + '"></audio></body>')
