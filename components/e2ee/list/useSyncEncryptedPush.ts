"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  ENCRYPTED_MESSAGES_WAKE_PARAM,
  getEncryptedMessagesRoute,
} from "@/helpers/navigation.helpers";
import { useE2ee } from "@/hooks/e2ee/useE2ee";

/** Refresh the encrypted list after a phone push, then clear the wake marker. */
export function useSyncEncryptedPush(): void {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, engine } = useE2ee();
  const woke = searchParams.get(ENCRYPTED_MESSAGES_WAKE_PARAM) !== null;

  useEffect(() => {
    if (!woke || status !== "ready" || !engine) {
      return;
    }
    let active = true;
    const listRoute = getEncryptedMessagesRoute();
    const clearWake = () => {
      if (!active || globalThis.location.pathname !== listRoute) {
        return;
      }
      router.replace(listRoute);
    };
    // Clear the marker even after a failed sync so another push can retry.
    void engine
      .sync()
      .catch(() => undefined)
      .then(clearWake);
    return () => {
      active = false;
    };
  }, [engine, router, status, woke]);
}
