// FR-NET-02, FR-NET-03: Say when the link is slow. The learner chooses text instead of video.
export function attachConnection(player) {
  const link = navigator.connection;
  if (!link) return;
  const slow = link.saveData || link.effectiveType === "2g" || link.effectiveType === "slow-2g" || (link.downlink && link.downlink < 0.8);
  if (!slow) return;
  const note = document.createElement("p");
  note.className = "lh-panel";
  note.setAttribute("role", "status");
  note.textContent = player.t("slow_link");
  player.slots.below.prepend(note);
}
