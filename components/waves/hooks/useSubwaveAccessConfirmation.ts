"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  hasSubwaveMembersOutsideParent,
  type SubwaveAccessCheck,
} from "@/services/api/subwave-access-api";

export function useSubwaveAccessConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const resolveConfirmation = useRef<((confirmed: boolean) => void) | null>(
    null
  );
  const abortController = useRef<AbortController | null>(null);
  const pendingCheck = useRef<Promise<boolean> | null>(null);

  useEffect(
    () => () => {
      abortController.current?.abort();
      resolveConfirmation.current?.(false);
    },
    []
  );

  const onDecision = useCallback((confirmed: boolean) => {
    resolveConfirmation.current?.(confirmed);
    resolveConfirmation.current = null;
    setIsOpen(false);
  }, []);

  const confirmSubwaveAccess = useCallback((check: SubwaveAccessCheck) => {
    if (pendingCheck.current) {
      return pendingCheck.current;
    }

    const controller = new AbortController();
    abortController.current = controller;
    pendingCheck.current = (async () => {
      const needsWarning = await hasSubwaveMembersOutsideParent(
        check,
        controller.signal
      );
      if (controller.signal.aborted) {
        return false;
      }
      if (!needsWarning) {
        return true;
      }
      return await new Promise<boolean>((resolve) => {
        resolveConfirmation.current = resolve;
        setIsOpen(true);
      });
    })().finally(() => {
      pendingCheck.current = null;
      abortController.current = null;
    });

    return pendingCheck.current;
  }, []);

  return { confirmSubwaveAccess, isOpen, onDecision };
}
