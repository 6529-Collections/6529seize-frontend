"use client";

import { useState } from "react";

// Moving the first post must not temporarily withdraw permission while a new
// membership query loads. Keep the same probe when browsing distant pages too;
// the server checks current membership and permission on every save.
export function useCurationPermissionProbe(
  curationId: string | undefined,
  drops: readonly { id: string }[]
) {
  const firstId = drops[0]?.id ?? "";
  const [probe, setProbe] = useState({ curationId, id: firstId });
  if (probe.curationId !== curationId || (!probe.id && firstId)) {
    setProbe({ curationId, id: firstId });
    return firstId;
  }
  return probe.id;
}
