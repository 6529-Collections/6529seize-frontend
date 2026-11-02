"use client";

import { useLegacyAnchors } from "@/components/explained/shell/LegacyAnchors";

const PREFIX = "glossary-";

/** The overview's old anchors used here: #glossary-tdh lands on #tdh. */
function glossaryAnchorTarget(hash: string): string | undefined {
  return hash.startsWith(PREFIX) ? hash.slice(PREFIX.length) : undefined;
}

export default function GlossaryAnchors() {
  useLegacyAnchors(glossaryAnchorTarget);
  return null;
}
