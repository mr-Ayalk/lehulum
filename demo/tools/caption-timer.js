// FR-CAP-01, FR-CAP-04: Tap caption starts and download WebVTT.
import { download, parseCsv, vtt } from "./caption-format.js";

const video = document.getElementById("vid");
const offset = document.getElementById("offset");
const $ = (id) => document.getElementById(id);
let lines = [], starts = [], speechEnd = null, actions = [], previewing = false, videoUrl = "";

function announce(text) {
  const live = $("live");
  live.textContent = "";
  setTimeout(() => { live.textContent = text; }, 50);
}

function endOf(i) {
  if (starts[i] == null) return null;
  let end = i < lines.length - 1 ? (starts[i + 1] == null ? null : starts[i + 1] - 0.05) : (speechEnd != null ? speechEnd : video.duration);
  if (!Number.isFinite(end)) return null;
  if (i < lines.length - 1) end = Math.min(end, starts[i + 1]);
  return Math.max(starts[i], end);
}

function showLine(node, title, line) {
  node.replaceChildren(title);
  if (!line) return;
  const am = document.createElement("span");
  am.lang = "am";
  am.textContent = " " + line.am;
  node.append(" " + line.id, am, " — " + line.en);
}

function paintCap() {
  const cap = $("cap");
  const time = video.currentTime;
  const hit = lines.findIndex((_, i) => starts[i] != null && endOf(i) != null && time >= starts[i] && time < endOf(i));
  cap.replaceChildren();
  if (!previewing || hit < 0) { cap.hidden = true; return; }
  const who = document.createElement("strong");
  who.textContent = "Teacher: ";
  const am = document.createElement("span");
  am.lang = "am";
  am.textContent = lines[hit].am;
  cap.lang = "am";
  cap.hidden = false;
  cap.append(who, am);
}

function render() {
  const next = starts.findIndex((value) => value == null);
  const body = $("times");
  body.replaceChildren();
  lines.forEach((line, i) => {
    const tr = document.createElement("tr");
    if (i === next) tr.setAttribute("aria-current", "true");
    const end = endOf(i);
    [line.id, starts[i] == null ? "—" : starts[i].toFixed(2), end == null ? "—" : end.toFixed(2), line.en].forEach((text) => {
      const cell = document.createElement("td");
      cell.textContent = text;
      tr.append(cell);
    });
    body.append(tr);
  });
  const current = next > 0 ? lines[next - 1] : (next < 0 && lines.length ? lines[lines.length - 1] : null);
  showLine($("now"), current ? "Current:" : "Current: —", current);
  showLine($("upcoming"), next < 0 ? "Next: all lines have a start." : "Next:", next < 0 ? null : lines[next]);
  $("tap").disabled = next < 0;
  $("undo").disabled = actions.length === 0;
  const done = lines.length > 0 && lines.every((_, i) => endOf(i) != null);
  $("dl-am").disabled = !done;
  $("dl-en").disabled = !done;
  paintCap();
}

function reset(speak) {
  starts = lines.map(() => null);
  speechEnd = null;
  actions = [];
  previewing = false;
  if (speak) {
    video.pause();
    if (Number.isFinite(video.duration)) video.currentTime = 0;
    announce("Restarted.");
  }
  render();
}

function useRows(records) {
  let list = records.filter((row) => row.id && (row.text_am || row.text_en));
  const amharic = list.filter((row) => row.id.startsWith("A"));
  if (amharic.length) list = amharic.slice(0, 14);
  lines = list.map((row) => ({ id: row.id, am: row.text_am || "", en: row.text_en || "" }));
  reset(false);
}

function tap() {
  const i = starts.findIndex((value) => value == null);
  if (i < 0) return;
  const at = Math.max(0, video.currentTime - Number(offset.value));
  starts[i] = Number.isFinite(video.duration) ? Math.min(video.duration, at) : at;
  actions.push(i);
  announce("Line " + lines[i].id + " starts at " + starts[i].toFixed(2) + " s");
  render();
}

function on(id, fn) { $(id).addEventListener("click", fn); }
on("tap", tap);
on("restart", () => reset(true));
on("undo", () => {
  const last = actions.pop();
  if (last == null) return;
  if (last === "end") { speechEnd = null; announce("Undid end of speech."); }
  else { starts[last] = null; announce("Undid line " + lines[last].id + "."); }
  render();
});
on("play", () => { video.paused ? video.play() : video.pause(); });
on("speech-end", () => {
  speechEnd = video.currentTime;
  actions.push("end");
  announce("End of speech at " + speechEnd.toFixed(2) + " s");
  render();
});
on("preview", () => { previewing = true; video.currentTime = 0; video.play(); paintCap(); });
on("dl-am", () => download("lesson.am.vtt", vtt(lines, starts, lines.map((_, i) => endOf(i)), "am")));
on("dl-en", () => download("lesson.en.vtt", vtt(lines, starts, lines.map((_, i) => endOf(i)), "en")));
document.querySelectorAll("[data-rate]").forEach((button) => {
  button.addEventListener("click", () => {
    video.playbackRate = Number(button.dataset.rate);
    document.querySelectorAll("[data-rate]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  });
});
offset.addEventListener("input", () => {
  const text = Number(offset.value).toFixed(2) + " s";
  $("offset-val").textContent = text;
  offset.setAttribute("aria-valuetext", text);
});
offset.setAttribute("aria-valuetext", "0.15 s");
video.addEventListener("play", () => { $("play").textContent = "Pause"; });
video.addEventListener("pause", () => { $("play").textContent = "Play"; });
video.addEventListener("timeupdate", paintCap);
video.addEventListener("loadedmetadata", render);
$("video-file").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (videoUrl) URL.revokeObjectURL(videoUrl);
  videoUrl = URL.createObjectURL(file);
  const track = video.querySelector("track");
  if (track) track.remove();
  video.src = videoUrl;
  reset(true);
});
$("text-file").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => useRows(parseCsv(String(reader.result)));
  reader.readAsText(file);
});
document.addEventListener("keydown", (event) => {
  if ((event.key !== "n" && event.key !== "N") || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  event.preventDefault();
  tap();
});
fetch("../data/phrases.csv").then((response) => response.text()).then((text) => useRows(parseCsv(text)))
  .catch(() => announce("Could not load the text list."));
