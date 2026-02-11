"use client";

import { useCallback, useEffect, useState } from "react";

type DropId = string | null | undefined;

type UseClosingDropIdResult = {
  readonly effectiveDropId: string | undefined;
  readonly beginClosingDrop: (dropId: string) => void;
};

export function useClosingDropId(dropId: DropId): UseClosingDropIdResult {
  const currentDropId = dropId ?? undefined;
  const [closingDropId, setClosingDropId] = useState<string | undefined>();

  const beginClosingDrop = useCallback((dropIdToClose: string) => {
    setClosingDropId(dropIdToClose);
  }, []);

  // Clear closingDropId once React's searchParams has diverged from the
  // previously-closing drop id, meaning URL updates have propagated.
  useEffect(() => {
    if (closingDropId !== undefined && currentDropId !== closingDropId) {
      setClosingDropId(undefined);
    }
  }, [currentDropId, closingDropId]);

  return {
    effectiveDropId:
      closingDropId !== undefined && currentDropId === closingDropId
        ? undefined
        : currentDropId,
    beginClosingDrop,
  };
}
