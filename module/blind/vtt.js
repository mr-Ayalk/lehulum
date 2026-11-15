// FR-BLV-07, FR-TRN-01: Read a WebVTT file into cues. No DOM.
function seconds(stamp) {
  const parts = stamp.trim().split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export function parseVtt(text) {
  const cues = [];
  for (const block of String(text || "").replace(/\r/g, "").split(/\n\n+/)) {
    const lines = block.split("\n").filter((line) => line && !line.startsWith("WEBVTT") && !line.startsWith("NOTE"));
    const timeAt = lines.findIndex((line) => line.includes("-->"));
    if (timeAt < 0) continue;
    const [start, end] = lines[timeAt].split("-->");
    cues.push({
      id: timeAt > 0 ? lines[0].trim() : "",
      start: seconds(start),
      end: seconds(end.split(" ")[0]),
      text: lines.slice(timeAt + 1).join("\n").trim()
    });
  }
  return cues;
}

export function cuesToText(cues) {
  return (cues || []).map((cue) => {
    const clock = new Date(Math.round(cue.start || 0) * 1000).toISOString().slice(14, 19);
    return clock + "  " + (cue.text || "");
  }).join("\n");
}
