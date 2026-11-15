// FR-NET-14, FR-NET-15: Keep progress on the phone and send it once when the network returns.
const KEY = "db-player:progress";

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (error) { return []; }
}
function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (error) { /* private */ }
}

export function attachProgress(player) {
  const api = player.host.getAttribute("api");
  if (!api) return;
  const lesson = player.host.getAttribute("lesson-id") || "python-01";

  async function send(items) {
    const left = [];
    for (const item of items) {
      try {
        const response = await fetch(api.replace(/\/$/, "") + "/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item)
        });
        if (!response.ok) left.push(item);
      } catch (error) {
        left.push(item);
      }
    }
    write(left);
    const note = player.slots.below.querySelector("[data-progress]");
    if (note) note.textContent = left.length ? player.t("saved_phone") : "";
  }

  function queue(kind, extra) {
    const item = {
      event_id: crypto.randomUUID(),
      lesson_id: lesson,
      learner_ref: "learner-demo",
      kind,
      at: new Date().toISOString(),
      ...extra
    };
    const items = read().concat(item);
    write(items);
    const note = player.slots.below.querySelector("[data-progress]") || document.createElement("p");
    note.dataset.progress = "1";
    note.setAttribute("role", "status");
    note.textContent = player.t("saved_phone");
    if (!note.isConnected) player.slots.below.append(note);
    send(items);
  }

  player.on("time", () => {});
  player.host.addEventListener("db-player:progress", (event) => queue("progress", event.detail || {}));
  player.host.addEventListener("db-player:complete", async () => {
    queue("complete", {});
    try {
      const response = await fetch(api.replace(/\/$/, "") + "/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lesson, learner_ref: "learner-demo" })
      });
      const body = await response.json();
      if (!response.ok || !body.id) return;
      const link = document.createElement("a");
      link.href = "/api/v1/certificates/" + body.id.split(":").pop() + "/page";
      link.textContent = player.t("cert_ready");
      player.slots.below.append(link);
    } catch (error) { /* the progress note already says it is saved */ }
  });
  window.addEventListener("online", () => send(read()));
}
