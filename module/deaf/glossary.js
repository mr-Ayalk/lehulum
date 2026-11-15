// FR-DEAF-09, FR-DEAF-10, FR-DEAF-11: Open the word list and play one sign without changing the lesson plan.
import { attachPanel } from "./glossary-panel.js";

function pieces(text, forms) {
  const hits = forms.slice().sort((a, b) => b.text.length - a.text.length);
  const out = [];
  let index = 0;
  const lower = text.toLowerCase();
  while (index < text.length) {
    const found = hits.find((form) => {
      const size = form.text.length;
      const slice = form.fold ? lower.slice(index, index + size) : text.slice(index, index + size);
      const same = slice === (form.fold ? form.text.toLowerCase() : form.text);
      const before = index > 0 ? text[index - 1] : "";
      const after = text[index + size] || "";
      const edge = !form.fold || !/[A-Za-z]/.test(before + after);
      return same && edge;
    });
    if (!found) { out.push(text[index]); index += 1; continue; }
    out.push({ hit: text.slice(index, index + found.text.length) });
    index += found.text.length;
  }
  const merged = [];
  for (const part of out) {
    if (typeof part !== "string") { merged.push(part); continue; }
    if (typeof merged[merged.length - 1] === "string") merged[merged.length - 1] += part;
    else merged.push(part);
  }
  return merged;
}

export async function attachGlossary(player) {
  const src = player.host.getAttribute("glossary");
  if (!src || player.glossary) return player.glossary;
  const doc = await (await fetch(src)).json();
  const terms = doc.terms || [];
  const forms = [];
  for (const term of terms) {
    for (const form of term.forms_en || []) forms.push({ text: form, fold: true });
    for (const form of term.forms_am || []) forms.push({ text: form, fold: false });
    if (term.en) forms.push({ text: term.en, fold: true });
    if (term.am) forms.push({ text: term.am, fold: false });
  }
  let card = null;
  let watch = null;
  let word = false;
  let slow = false;

  function cardOf() {
    if (card) return card;
    const root = player.shadow.querySelector(".sign-window");
    if (!root) return null;
    card = document.createElement("div");
    card.className = "word-card";
    card.hidden = true;
    const note = document.createElement("p");
    note.setAttribute("role", "status");
    const replay = document.createElement("button");
    replay.type = "button";
    const rate = document.createElement("button");
    rate.type = "button";
    rate.setAttribute("aria-pressed", "false");
    card.append(note, replay, rate);
    root.append(card);
    card.note = note;
    card.replay = replay;
    card.rate = rate;
    return card;
  }
  function stopWatch() { if (watch) { watch.video.removeEventListener("timeupdate", watch.fn); watch = null; } }
  function hideWord() { word = false; stopWatch(); if (card) card.hidden = true; }

  async function signApi() {
    if (player.sign) return player.sign;
    const mod = await import("./sign-boot.js");
    return mod.attachSign(player);
  }
  async function show(term) {
    if (!term.sign) {
      const status = player.shadow.querySelector(".words [role=status]");
      if (status) status.textContent = player.t("no_word_sign");
      player.announce("no_word_sign");
      return;
    }
    player.media.pause();
    const sign = await signApi();
    const url = new URL(term.sign, new URL(src, location.href)).href;
    const video = sign.play(url, { word: true, from: term.from, to: term.to, rate: slow ? 0.75 : 1 });
    const face = cardOf();
    if (!face) return;
    face.hidden = false;
    face.note.textContent = player.t("word_label", { am: term.am, en: term.en });
    face.replay.textContent = player.t("replay");
    face.rate.textContent = player.t("word_slow");
    face.replay.onclick = () => { video.currentTime = term.from; video.playbackRate = slow ? 0.75 : 1; video.play().catch(() => {}); };
    face.rate.onclick = () => {
      slow = !slow;
      video.playbackRate = slow ? 0.75 : 1;
      face.rate.setAttribute("aria-pressed", slow ? "true" : "false");
    };
    stopWatch();
    const fn = () => { if ((video.currentTime || 0) >= term.to - 0.04) video.pause(); };
    video.addEventListener("timeupdate", fn);
    watch = { video, fn };
    word = true;
  }
  player.media.addEventListener("play", () => {
    if (!word) return;
    hideWord();
    player.sign?.resumeLesson?.();
  });
  const panel = attachPanel(player, terms, show);
  player.on("cue", (event) => panel.setCue(event.cue?.id || ""));
  player.registerShortcut("g", "key_g", () => panel.toggle());
  player.glossary = {
    terms,
    mark(line) {
      for (const span of [...line.querySelectorAll("span")]) {
        if (span.closest(".who") || span.dataset.gloss) continue;
        const parts = pieces(span.textContent, forms);
        if (parts.length === 1 && typeof parts[0] === "string") continue;
        span.replaceChildren();
        for (const part of parts) {
          const bit = document.createElement("span");
          bit.textContent = typeof part === "string" ? part : part.hit;
          if (typeof part !== "string") bit.className = "term";
          span.append(bit);
        }
        span.dataset.gloss = "1";
      }
    },
    markList(root) {
      const list = root?.querySelector?.(".transcript, [data-transcript]");
      if (!list) return;
      const label = player.t("glossary_word");
      for (const item of list.querySelectorAll("li")) {
        if (item.querySelector("mark")) continue;
        const parts = pieces(item.textContent, forms);
        if (!parts.some((part) => typeof part !== "string")) continue;
        item.replaceChildren();
        for (const part of parts) {
          if (typeof part === "string") { item.append(document.createTextNode(part)); continue; }
          const mark = document.createElement("mark");
          mark.textContent = part.hit;
          const hidden = document.createElement("span");
          hidden.className = "sr-only";
          hidden.textContent = " " + label;
          mark.append(hidden);
          item.append(mark);
        }
      }
    },
    staysClear() {
      const cap = player.shadow.querySelector(".captions");
      const panelBox = panel.root.getBoundingClientRect();
      const label = card?.getBoundingClientRect();
      const caption = cap && !cap.hidden ? cap.getBoundingClientRect() : null;
      const hit = (box) => caption && box && box.width && caption.width && box.bottom > caption.top && box.top < caption.bottom && box.right > caption.left && box.left < caption.right;
      return panel.root.parentElement === player.slots.panels && !hit(panelBox) && !hit(label);
    }
  };
  player.glossary.markList(player.shadow);
  player.captions?.refresh?.();
  return player.glossary;
}
