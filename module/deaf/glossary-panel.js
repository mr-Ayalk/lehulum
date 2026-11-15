// FR-DEAF-09, FR-DEAF-10: The Words panel. One list stop, search, and this-line switch.
const CSS = `<style data-words>
.words{position:relative;display:flex;flex-direction:column;gap:.85rem;margin:0;padding:1.25rem 1.15rem 1rem;border-top:3px solid var(--lh-accent,#0A6B4E);background:var(--lh-surface,#fff);color:var(--lh-text,#1C1B18);max-height:70vh;overflow:auto}
@media (min-width:720px){
.player:has(#words-panel:not([hidden])){display:grid;grid-template-columns:minmax(0,1fr) minmax(18rem,22rem)}
.player:has(#words-panel:not([hidden]))>.stage{grid-area:1/1}
.player:has(#words-panel:not([hidden]))>.controls{grid-area:2/1}
.player:has(#words-panel:not([hidden]))>.below{grid-area:3/1}
.player:has(#words-panel:not([hidden]))>.panels{grid-area:1/2/span 4;border-left:1px solid var(--lh-line,#D9D3C7);min-height:0}
.player:has(#words-panel:not([hidden]))>.sr-only,.player:has(#words-panel:not([hidden]))>dialog{grid-column:1}
.player:has(#words-panel:not([hidden])) .words{border-top:0;max-height:none}
}
.words h2{margin:0;font-size:1.35rem;font-weight:700;line-height:1.45}
.words .count{margin:.15rem 0 0;color:var(--lh-text-muted,#57534A);font-size:.95rem}
.words input,.words .close,.words .go{min-height:2.75rem;font:inherit;color:var(--lh-text,#1C1B18)}
.words input{width:100%;padding:0 .85rem;border:1px solid var(--lh-border,#8A8478);border-radius:8px;background:var(--lh-surface,#fff)}
.words input:hover,.words .close:hover,.words .term button:hover{border-color:var(--lh-text,#1C1B18)}
.switch{display:flex;align-items:center;justify-content:space-between;gap:.75rem;width:100%;min-height:2.75rem;padding:0;border:0;background:transparent;color:inherit;text-align:start;font:inherit}
.knob{position:relative;flex:0 0 auto;width:3.25rem;height:2rem;border:1px solid var(--lh-border,#8A8478);border-radius:999px;background:var(--lh-surface-2,#F1EDE4)}
.knob::after{content:"";position:absolute;top:3px;left:3px;width:1.35rem;height:1.35rem;border-radius:50%;background:var(--lh-text-muted,#57534A)}
.switch[aria-checked="true"] .knob{background:var(--lh-accent,#0A6B4E);border-color:var(--lh-accent,#0A6B4E)}
.switch[aria-checked="true"] .knob::after{left:1.45rem;background:var(--lh-on-accent,#fff)}
.words ul{list-style:none;margin:0;padding:0}
.term{padding:.65rem .35rem;border-top:1px solid var(--lh-line,#D9D3C7)}
.term.on{background:var(--lh-surface-2,#F1EDE4);box-shadow:inset 3px 0 0 var(--lh-accent,#0A6B4E);padding-inline-end:8.5rem}
.am{margin:0;font-family:var(--lh-font-ethiopic,"Noto Sans Ethiopic",sans-serif);font-size:1.45rem;font-weight:700;line-height:1.7}
.en{margin:0;color:var(--lh-text-muted,#57534A)}
.cues{margin:.1rem 0 0;font-family:var(--lh-font-code,"JetBrains Mono",ui-monospace,monospace);font-size:.82rem;color:var(--lh-text-muted,#57534A)}
.go,.close{padding:0 .9rem;border:1px solid var(--lh-border,#8A8478);border-radius:8px;background:var(--lh-surface,#fff)}
.go{position:absolute;right:1.15rem;font-weight:700}
.close{width:100%}
.words :focus-visible{outline:3px solid var(--lh-focus,#1C1B18);outline-offset:2px}
.empty{margin:0;color:var(--lh-text-muted,#57534A)}
.word-card{position:absolute;left:0;right:0;bottom:0;z-index:6;display:flex;flex-wrap:wrap;gap:.35rem;max-height:100%;overflow:auto;padding:.45rem;border-top:1px solid var(--lh-player-border,#8C8678);background:var(--lh-player-bg,#14130F);color:var(--lh-player-text,#F3F0E8)}
.word-card p{flex:1 0 100%;margin:0;font-size:.95rem;line-height:1.4}
.word-card button{min-height:2.75rem;padding:0 .75rem;border:1px solid var(--lh-player-border,#8C8678);border-radius:8px;background:transparent;color:inherit;font:inherit}
.word-card button:focus-visible{outline:3px solid var(--lh-player-focus,#FFD54A);outline-offset:2px}
</style>`;

function node(tag, attrs, text) {
  const item = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => item.setAttribute(key, value));
  if (text != null) item.textContent = text;
  return item;
}

export function attachPanel(player, terms, show) {
  if (!player.shadow.querySelector("style[data-words]")) player.shadow.append(document.createRange().createContextualFragment(CSS));
  const root = node("section", { class: "words", id: "words-panel", "aria-labelledby": "words-title" });
  root.hidden = true;
  const title = node("h2", { id: "words-title" });
  const count = node("p", { class: "count", role: "status" });
  const search = node("input", { type: "search" });
  const only = node("button", { type: "button", class: "switch", role: "switch", "aria-checked": "false" });
  const onlyText = node("span");
  const knob = node("span", { class: "knob", "aria-hidden": "true" });
  only.append(onlyText, knob);
  const empty = node("p", { class: "empty" });
  empty.hidden = true;
  const list = node("ul", { role: "listbox" });
  const go = node("button", { type: "button", class: "go", tabindex: "-1" });
  go.hidden = true;
  const shut = node("button", { type: "button", class: "close" });
  const head = node("div", { class: "head" });
  head.append(title, count);
  root.append(head, search, only, empty, list, go, shut);
  go.addEventListener("click", () => { if (shown[index]) jump(shown[index]); });
  shut.addEventListener("click", () => close());
  player.slots.panels.append(root);
  let cue = "";
  let open = false;
  let index = 0;
  let shown = [];
  let quiet = false;

  function paint(keep) {
    const query = search.value.trim().toLowerCase();
    const line = only.getAttribute("aria-checked") === "true";
    const onLine = terms.filter((term) => !line || term.cues.includes(cue));
    shown = onLine.filter((term) => !query || [term.am, term.en, ...(term.forms_am || []), ...(term.forms_en || [])].some((form) => String(form).toLowerCase().includes(query)));
    if (index >= shown.length) index = 0;
    const none = line && !onLine.length;
    empty.hidden = !none;
    empty.textContent = none ? player.t("no_words_line") : "";
    count.textContent = none ? player.t("no_words_line") : player.t("results_count", { count: shown.length });
    list.hidden = !shown.length;
    list.replaceChildren();
    shown.forEach((term, at) => {
      const item = node("li", { class: at === index ? "term on" : "term", role: "option", tabindex: at === index ? "0" : "-1" });
      item.setAttribute("aria-posinset", String(at + 1));
      item.setAttribute("aria-setsize", String(shown.length));
      if (at === index) item.setAttribute("aria-selected", "true");
      item.append(node("p", { class: "am", lang: "am" }, term.am), node("p", { class: "en", lang: "en" }, term.en), node("p", { class: "cues" }, term.cues.join(" · ")));
      item.addEventListener("click", () => { index = at; show(term); paint(true); });
      list.append(item);
    });
    const row = list.querySelector(".term.on");
    go.hidden = !row;
    if (row) { go.textContent = player.t("go_to_line"); go.style.top = `${row.offsetTop + 8}px`; }
    if (keep) row?.focus();
  }
  function say() {
    if (shown.length) player.announce("term_of", { n: index + 1, total: shown.length });
  }
  function move(next) {
    if (!shown.length) return;
    index = Math.max(0, Math.min(shown.length - 1, next));
    quiet = true;
    paint(true);
    quiet = false;
    say();
  }
  function jump(term) {
    const cues = player.captions?.getCues?.("am") || player.captions?.getCues?.("en") || [];
    const hit = cues.find((item) => item.id === term.cues[0]);
    if (hit) player.media.currentTime = hit.start;
  }
  list.addEventListener("focusin", () => { if (!quiet) say(); });
  list.addEventListener("keydown", (event) => {
    const key = event.key;
    if (key === "ArrowDown") move(index + 1);
    else if (key === "ArrowUp") move(index - 1);
    else if (key === "Home") move(0);
    else if (key === "End") move(shown.length - 1);
    else if (key === "Enter" && shown[index]) {
      if (event.shiftKey) jump(shown[index]);
      else show(shown[index]);
    } else return;
    event.preventDefault();
    event.stopPropagation();
  });
  function labels() {
    title.textContent = player.t("words_in_lesson");
    search.setAttribute("aria-label", player.t("search_words"));
    search.placeholder = player.t("search_words");
    onlyText.textContent = player.t("only_this_line");
    shut.textContent = player.t("close");
    list.setAttribute("aria-label", player.t("words_in_lesson"));
    paint(false);
  }
  search.addEventListener("input", () => paint(list.contains(player.shadow.activeElement)));
  only.addEventListener("click", () => { only.setAttribute("aria-checked", only.getAttribute("aria-checked") === "true" ? "false" : "true"); paint(false); });
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    close();
  });
  function close() { open = false; root.hidden = true; button.focus(); }
  function toggle() {
    open = !open;
    root.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) { labels(); search.focus(); }
  }
  const button = player.addControl({ id: "glossary", order: 49, labelKey: "words", onClick: toggle });
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "words-panel");
  labels();
  return { toggle, close, setCue(id) { cue = id || ""; if (open) paint(false); }, root, button, search, only };
}
