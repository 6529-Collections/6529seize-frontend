/**
 * Anchors of the specification page before 6529 Explained, and where they
 * land now (MAP.md §2). Sections and subsections keep their ids (s1 to s13,
 * s5-2), and so do the deviations and issues (dev-2, bug-15) and the
 * replayed day (evidence-replay); the rest move here.
 */
const SPEC_MOVED: Readonly<Record<string, string>> = {
  symbols: "s1",
  decisions: "s11",
  changes: "s13",
  "evidence-clean-room": "evidence",
  "evidence-comparison": "evidence",
  "evidence-difftest": "evidence",
  "spec-implementers": "s13",
  "spec-version-heading": "this-version",
  top: "this-version",
};

/** Where an old anchor lands; a decision's ("d121") on the deviations it decided. */
export function specAnchorTarget(hash: string): string | undefined {
  return SPEC_MOVED[hash] ?? (/^d\d{1,3}$/.test(hash) ? "s11" : undefined);
}
