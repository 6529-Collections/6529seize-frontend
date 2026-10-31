"use client";

import { useLegacyAnchors } from "@/components/explained/shell/LegacyAnchors";

/** Anchors of the implementations page before this one, and where they land. */
const MOVED: Readonly<Record<string, string>> = {
  programs: "cast",
  written: "cast",
  where: "cast",
  "lineage-narrow": "cast",
  "lineage-wide": "cast",
  checked: "difftest-rounds",
  latest: "roots",
};

/** A vector's old anchor ("04-mid-period-transfer", "by-hand-04") lands on the vectors. */
function implAnchorTarget(hash: string): string | undefined {
  if (MOVED[hash] !== undefined) {
    return MOVED[hash];
  }
  return /^\d{2}[a-z]?-/.test(hash) || hash.startsWith("by-hand-")
    ? "vectors"
    : undefined;
}

export default function ImplAnchors() {
  useLegacyAnchors(implAnchorTarget);
  return null;
}
