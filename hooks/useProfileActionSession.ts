"use client";

import { canReplyFromSession } from "@/helpers/waves/drop-reply-eligibility";
import { useCallback, useLayoutEffect, useRef } from "react";

/** Keep an authentication wait from outliving its action UI or session. */
export function useProfileActionSession(
  auth: Parameters<typeof canReplyFromSession>[0]
) {
  const hasProfileSession = canReplyFromSession(auth);
  const available = useRef(hasProfileSession);
  useLayoutEffect(() => {
    available.current = hasProfileSession;
    return () => {
      available.current = false;
    };
  }, [hasProfileSession]);
  const isSessionActive = useCallback(() => available.current, []);
  return { hasProfileSession, isSessionActive };
}
