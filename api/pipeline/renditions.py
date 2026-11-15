# FR-NET-01, FR-SL-14: A small video and an audio file, when ffmpeg is installed.
import shutil
import subprocess
from pathlib import Path


def ffmpeg():
    return shutil.which("ffmpeg")


def make_light(folder, source_name="video.mp4"):
    video = Path(folder) / source_name
    program = ffmpeg()
    if not video.is_file() or not program:
        return {"video": False, "audio": False}
    light = Path(folder) / "light.mp4"
    audio = Path(folder) / "audio.m4a"
    made = {"video": light.is_file(), "audio": audio.is_file()}
    if not light.is_file():
        result = subprocess.run(
            [program, "-y", "-i", str(video), "-vf", "scale=426:-2", "-c:v", "libx264",
             "-crf", "32", "-preset", "veryfast", "-c:a", "aac", "-b:a", "32k", "-ac", "1",
             "-movflags", "+faststart", str(light)],
            capture_output=True)
        made["video"] = result.returncode == 0 and light.is_file()
    if not audio.is_file():
        result = subprocess.run(
            [program, "-y", "-i", str(video), "-vn", "-c:a", "aac", "-b:a", "40k", "-ac", "1", str(audio)],
            capture_output=True)
        made["audio"] = result.returncode == 0 and audio.is_file()
    return made
