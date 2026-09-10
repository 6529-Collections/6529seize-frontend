"use client";

import { useAuth } from "@/components/auth/Auth";
import { useCallback, useEffect } from "react";

type ReactionView = { count: number; active: boolean };
const reactionViews = new Map<string, ReactionView>();

// Stream cache updates can remount a drop, and removing its last reaction
// unmounts a chip. Feedback belongs to the visible drop/account, not that chip.
// Consumers have independent lifetimes; each owns one balanced registration.
export const useDropReactionView = (dropId: string) => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const key = JSON.stringify([
    dropId,
    connectedProfile?.id,
    activeProfileProxy?.id,
  ]);
  useEffect(() => {
    const view = reactionViews.get(key) ?? { count: 0, active: true };
    view.count += 1;
    reactionViews.set(key, view);
    return () => {
      view.count -= 1;
      // React runs cleanup/setup together during a remount. Preserve that view
      // lifetime, but retire it once the drop really leaves the mounted UI.
      globalThis.queueMicrotask(() => {
        if (view.count === 0) {
          view.active = false;
          if (reactionViews.get(key) === view) reactionViews.delete(key);
        }
      });
    };
  }, [key]);

  return useCallback(() => {
    const view = reactionViews.get(key);
    return () => view?.active === true && view.count > 0;
  }, [key]);
};
