"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { ensureActiveSession } from "@/services/auth/session-readiness";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";

/** Foreground renewal is best effort; protected requests also await readiness. */
export function useSessionRecovery(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    const recover = (event?: Event) => {
      if (
        disposed ||
        document.visibilityState === "hidden" ||
        !navigator.onLine
      )
        return;
      // Persistence emits these events synchronously. A newly issued token
      // with a short lifetime must not trigger another proactive renewal loop.
      const authChanged =
        event?.type === AUTH_TOKEN_CHANGED_EVENT ||
        event?.type === WALLET_ACCOUNTS_UPDATED_EVENT;
      void ensureActiveSession({
        renewBeforeSeconds: authChanged ? 0 : 60,
      }).catch(() => {
        // Offline/overload is retried on the next tick, focus or online event.
        // Keep the saved session and existing content available meanwhile.
      });
    };
    recover();
    const timer = window.setInterval(recover, 30_000);
    document.addEventListener("visibilitychange", recover);
    for (const event of [
      "focus",
      "online",
      AUTH_TOKEN_CHANGED_EVENT,
      WALLET_ACCOUNTS_UPDATED_EVENT,
    ]) {
      window.addEventListener(event, recover);
    }
    const listener = Capacitor.isNativePlatform()
      ? App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) recover();
        })
      : null;
    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", recover);
      for (const event of [
        "focus",
        "online",
        AUTH_TOKEN_CHANGED_EVENT,
        WALLET_ACCOUNTS_UPDATED_EVENT,
      ]) {
        window.removeEventListener(event, recover);
      }
      void listener?.then((handle) => handle.remove()).catch(() => undefined);
    };
  }, [enabled]);
}
