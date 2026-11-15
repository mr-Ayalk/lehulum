// FR-NET-02: Pick a lesson size from the connection. No DOM.
export function chooseVariant(connection) {
  if (!connection) return "full";
  if (connection.saveData || connection.effectiveType === "2g" || connection.effectiveType === "slow-2g") return "text";
  if (connection.effectiveType === "3g" || (connection.downlink && connection.downlink < 1.5)) return "light";
  return "full";
}
