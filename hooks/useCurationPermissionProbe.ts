"use client";

import { useState } from "react";

// Moving the first post must not temporarily withdraw permission while a new
// membership query loads. Keep the same probe when browsing distant pages too;
// the server checks current membership and permission on every save.
export function useCurationPermissionProbe(
  curationId: string | undefined,
  drops: readonly { id: string }[],
  isPlaceholderData = false
) {
  const firstId = drops[0]?.id ?? "";
  const [probe, setProbe] = useState({ curationId, id: firstId });
  if (probe.curationId !== curationId) {
    setProbe({ curationId, id: "" });
    return "";
  }
  if (isPlaceholderData) return probe.id;
  const nextId = drops.some((drop) => drop.id === probe.id)
    ? probe.id
    : firstId;
  if (probe.id !== nextId) {
    setProbe({ curationId, id: nextId });
    return nextId;
  }
  return probe.id;
}
