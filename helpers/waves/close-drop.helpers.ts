/** Close client-owned drop detail without waiting for a server route transition. */
export function closeDropInCurrentUrl() {
  const url = new URL(globalThis.location.href);
  url.searchParams.delete("drop");

  // Next synchronizes useSearchParams through its external History API wrapper.
  // Passing existing router markers would bypass that synchronization. Restore
  // app metadata afterward, retaining Next's newly computed router state.
  const previousState: unknown = globalThis.history.state;
  globalThis.history.replaceState(null, "", url);
  const currentState: unknown = globalThis.history.state;
  globalThis.history.replaceState(
    {
      ...(typeof previousState === "object" && previousState !== null
        ? previousState
        : {}),
      ...(typeof currentState === "object" && currentState !== null
        ? currentState
        : {}),
    },
    ""
  );
}
