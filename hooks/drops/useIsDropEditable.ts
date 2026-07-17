"use client";

import { isDropEditableAt } from "@/helpers/waves/drop-editability.helpers";
import { useEffect, useState } from "react";

// setTimeout treats delays above 2^31 - 1 ms (~24.8 days) as 0 and fires
// immediately; longer waits are chunked and re-evaluated instead.
const MAX_TIMEOUT_DELAY_MS = 2 ** 31 - 1;

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
    let handle: ReturnType<typeof setTimeout> | undefined;

    const evaluateAndArm = () => {
      const editableNow = isDropEditableAt({
        editableUntil,
        atMillis: Date.now(),
      });
      setIsEditable((previous) =>
        previous === editableNow ? previous : editableNow
      );
      if (!editableNow || typeof editableUntil !== "number") {
        return;
      }
      // Re-evaluate at the deadline (or at the max representable delay for
      // far-future deadlines, then re-arm) rather than assuming expiry.
      const remainingMs = editableUntil - Date.now() + 50;
      handle = setTimeout(
        evaluateAndArm,
        Math.min(Math.max(remainingMs, 0), MAX_TIMEOUT_DELAY_MS)
      );
    };

    evaluateAndArm();
    return () => clearTimeout(handle);
  }, [editableUntil]);

  return isEditable;
}
