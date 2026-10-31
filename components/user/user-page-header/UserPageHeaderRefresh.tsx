"use client";

import {
  hydrate,
  useQueryClient,
  type DehydratedState,
} from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Applies a profile tab page's header snapshot once it streams in.
 *
 * The header belongs to the persistent profile layout, which does not
 * re-render when switching tabs, so every tab page carries a fresh snapshot.
 * Taking it as a promise keeps the tab content from waiting for the header's
 * requests. `hydrate` only replaces cached data with newer data, so a slower
 * snapshot never overwrites a later local edit.
 */
export default function UserPageHeaderRefresh({
  state,
}: {
  readonly state: Promise<DehydratedState>;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    // A promise passed from a Server Component arrives as React's own
    // thenable, whose then() does not return a promise, so wrap it before
    // chaining. A failed snapshot keeps the header's current data.
    Promise.resolve(state)
      .then((snapshot) => {
        if (active) {
          hydrate(queryClient, snapshot);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [queryClient, state]);

  return null;
}
