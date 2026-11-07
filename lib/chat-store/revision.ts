/**
 * Stale-revision rule, folded in from the stalled FE #4128 (D4): once an
 * edit has been seen (numeric `updated_at`), an older or unedited snapshot
 * of the same drop is rejected. Equal revisions are accepted because
 * reactions, votes and ratings change without an edit.
 */
export function isOlderRevision(
  incoming: { readonly updated_at?: unknown },
  current: { readonly updated_at?: unknown }
): boolean {
  return (
    typeof current.updated_at === "number" &&
    (typeof incoming.updated_at !== "number" ||
      incoming.updated_at < current.updated_at)
  );
}
