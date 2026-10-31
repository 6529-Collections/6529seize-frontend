"use client";

import { useLegacyAnchors } from "@/components/explained/shell/LegacyAnchors";
import { specAnchorTarget } from "./specAnchors";

/** The specification's old anchors land where their content now is. */
export default function SpecificationAnchors() {
  useLegacyAnchors(specAnchorTarget);
  return null;
}
