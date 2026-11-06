"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";

const EDIT_WINDOW_MS = 5 * 60_000;
const getServerSnapshot = () => false;

/** Match the server's last-touched deadline; wave descriptions are exempt. */
export function useDropEditWindow(drop: ApiDrop, isAuthor: boolean): boolean {
  const exempt = drop.wave.description_drop_id === drop.id;
  const deadline = (drop.updated_at ?? drop.created_at) + EDIT_WINDOW_MS;
  const getSnapshot = useCallback(
    () =>
      isAuthor &&
      (exempt || (Number.isFinite(deadline) && Date.now() <= deadline)),
    [deadline, exempt, isAuthor]
  );
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (
        !isAuthor ||
        exempt ||
        !Number.isFinite(deadline) ||
        deadline < Date.now()
      )
        return () => {};
      const timeout = setTimeout(onChange, deadline - Date.now() + 1);
      globalThis.addEventListener("focus", onChange);
      return () => {
        clearTimeout(timeout);
        globalThis.removeEventListener("focus", onChange);
      };
    },
    [deadline, exempt, isAuthor]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
