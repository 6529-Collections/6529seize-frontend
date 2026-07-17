"use client";

import { isDropEditableAt } from "@/helpers/waves/drop-editability.helpers";
import { useEffect, useState } from "react";

/**
 * Tracks whether a drop is still within its edit window. Re-evaluates
 * exactly when the deadline passes so the edit affordance disappears
 * without waiting for an unrelated re-render.
 */
export function useIsDropEditable(
  editableUntil: number | null | undefined
): boolean {
  const [isEditable, setIsEditable] = useState(() =>
    isDropEditableAt({ editableUntil, atMillis: Date.now() })
  );

  useEffect(() => {
    const editableNow = isDropEditableAt({
      editableUntil,
      atMillis: Date.now(),
    });
    setIsEditable(editableNow);
    if (!editableNow || typeof editableUntil !== "number") {
      return;
    }
    const handle = setTimeout(
      () => {
        setIsEditable(false);
      },
      Math.max(editableUntil - Date.now(), 0) + 50
    );
    return () => clearTimeout(handle);
  }, [editableUntil]);

  return isEditable;
}
