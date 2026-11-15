// FR-CAP-01, FR-CAP-04: CSV phrases and WebVTT text for the caption timer.

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (char !== "\r") cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map((name) => name.trim());
  return rows.filter((item) => item.some((part) => part.trim())).map((item) => {
    const record = {};
    head.forEach((name, index) => { record[name] = item[index] || ""; });
    return record;
  });
}

export function stamp(seconds) {
  const ms = Math.round(Math.max(seconds, 0) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return pad(h) + ":" + pad(m) + ":" + pad(s) + "." + String(ms % 1000).padStart(3, "0");
}

export function vtt(lines, starts, ends, lang) {
  const sound = lang === "am" ? "[የስህተት ድምፅ]" : "[error sound]";
  let out = "WEBVTT\n\n";
  lines.forEach((line, i) => {
    out += line.id + "\n" + stamp(starts[i]) + " --> " + stamp(ends[i]) + "\n<v Teacher>" + line[lang] + "\n";
    if (line.id === "A11") out += sound + "\n";
    out += "\n";
  });
  return out;
}

export function download(name, text) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type: "text/vtt" }));
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
