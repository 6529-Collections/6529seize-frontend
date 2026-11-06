/** Equal revisions may carry newer reactions or votes; only older content is rejected. */
export function isOlderDropVersion(
  incoming: { readonly updated_at?: number | null },
  current: { readonly updated_at?: unknown } | undefined
): boolean {
  return (
    typeof current?.updated_at === "number" &&
    (typeof incoming.updated_at !== "number" ||
      incoming.updated_at < current.updated_at)
  );
}
