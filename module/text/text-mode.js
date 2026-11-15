// FR-IN-02, FR-IN-06, FR-IN-10: Read a text lesson in place. The host page is not rewritten.
export function attachTextMode(player) {
  const selector = player.host.getAttribute("for");
  if (!selector) return;
  const article = document.querySelector(selector);
  if (!article) return;
  if (!player.host.getAttribute("src")) player.shadow.querySelector(".stage").hidden = true;
  const nodes = [...article.querySelectorAll("p, pre, li")];
  let index = 0;
  const bar = document.createElement("div");
  bar.className = "lh-panel";
  const prev = document.createElement("button");
  const next = document.createElement("button");
  const listen = document.createElement("button");
  prev.type = next.type = listen.type = "button";
  prev.textContent = player.t("text_prev");
  next.textContent = player.t("text_next");
  listen.textContent = player.t("text_listen");
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  bar.append(prev, next, listen, status);
  player.slots.below.append(bar);

  function show(step) {
    index = Math.min(nodes.length - 1, Math.max(0, index + step));
    for (const node of nodes) node.style.outline = "";
    const node = nodes[index];
    if (!node) return;
    node.style.outline = "3px solid #146C43";
    node.scrollIntoView({ block: "nearest" });
    status.textContent = player.t("text_line") + " " + (index + 1) + " / " + nodes.length;
    player.host.dispatchEvent(new CustomEvent("db-player:progress", {
      bubbles: true, composed: true, detail: { seconds: index, percent: Math.round((index + 1) / nodes.length * 100) }
    }));
  }

  prev.addEventListener("click", () => show(-1));
  next.addEventListener("click", () => show(1));
  listen.addEventListener("click", () => {
    const text = nodes[index]?.innerText || "";
    const live = player.shadow.querySelector(".sr-only");
    if (live) live.textContent = text;
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = article.lang === "am" ? "am-ET" : "en";
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  });
  if (nodes.length) show(0);
}
