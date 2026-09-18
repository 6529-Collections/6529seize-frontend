import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { flushPendingPushLogouts } from "@/services/notifications/push-installation";
import { useEffect, useRef, type RefObject } from "react";

export function usePushRegistrationRecovery({
  isActive,
  isCapacitor,
  initializeNotifications,
  profileRef,
  retryPendingRef,
  inFlightRef,
  onError,
}: {
  isActive: boolean;
  isCapacitor: boolean;
  initializeNotifications: (profile?: ApiIdentity) => Promise<void>;
  profileRef: RefObject<ApiIdentity | null>;
  retryPendingRef: RefObject<boolean>;
  inFlightRef: RefObject<Promise<void> | null>;
  onError: (error: unknown) => void;
}): void {
  const wasActiveRef = useRef(isActive);
  useEffect(() => {
    const becameActive = isActive && !wasActiveRef.current;
    wasActiveRef.current = isActive;
    let current = true;
    const flush = (retryRegistration: boolean) => {
      void (async () => {
        const reconciled = await flushPendingPushLogouts();
        const registrationFailed = retryRegistration && retryPendingRef.current;
        if (
          (reconciled || registrationFailed) &&
          !inFlightRef.current &&
          current &&
          isCapacitor &&
          isActive
        ) {
          await initializeNotifications(profileRef.current ?? undefined);
        }
      })().catch(onError);
    };
    // Callback/auth changes already have their own initialization path.
    if (isActive) flush(becameActive);
    const onOnline = () => flush(true);
    globalThis.addEventListener("online", onOnline);
    return () => {
      current = false;
      globalThis.removeEventListener("online", onOnline);
    };
  }, [
    isActive,
    isCapacitor,
    initializeNotifications,
    profileRef,
    retryPendingRef,
    inFlightRef,
    onError,
  ]);
}
