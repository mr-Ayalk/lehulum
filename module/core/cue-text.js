// FR-CAP-04, FR-HOH-11: Split a WebVTT cue into speaker, sounds, and uncertain words.
export function parseCueText(input) {
  const src = String(input || "").replace(/\r\n/g, "\n");
  const parts = [];
  const sounds = [];
  let speaker = "";
  let low = false;
  let i = 0;
  const push = (type, text) => {
    if (!text) return;
    const prev = parts[parts.length - 1];
    if (prev && prev.type === type) prev.text += text;
    else parts.push({ type, text });
  };
  while (i < src.length) {
    if (src[i] === "<") {
      const end = src.indexOf(">", i);
      if (end < 0) { push(low ? "low" : "text", src.slice(i)); break; }
      const tag = src.slice(i + 1, end).trim();
      const voice = /^v(?:\.\S+)?(?:\s+(.+))?$/i.exec(tag);
      if (voice) speaker = speaker || (voice[1] || "").trim();
      else if (/^c\.low\b/i.test(tag)) low = true;
      else if (/^\/c\b/i.test(tag)) low = false;
      i = end + 1;
      continue;
    }
    if (src[i] === "[") {
      const end = src.indexOf("]", i);
      if (end > i) {
        const sound = src.slice(i + 1, end).trim();
        if (sound) { sounds.push(sound); push("sound", sound); }
        i = end + 1;
        continue;
      }
    }
    let next = src.length;
    for (const mark of ["<", "["]) {
      const at = src.indexOf(mark, i);
      if (at >= 0 && at < next) next = at;
    }
    push(low ? "low" : "text", src.slice(i, next));
    i = next;
  }
  return { speaker, sounds, parts };
}

export function plainText(parsed) {
  return parsed.parts.filter((part) => part.type !== "sound").map((part) => part.text).join("").replace(/\s+/g, " ").trim();
}
