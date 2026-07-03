"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProfileSubscriptionsHref } from "./subscriptionNavigation";

const PROFILE_SUBSCRIPTIONS_CONNECT_TIMEOUT_MS = 120_000;
const PROFILE_SUBSCRIPTIONS_PENDING_NAVIGATION_KEY =
  "6529:profile-subscriptions-pending-navigation";

function getPendingNavigationExpiresAt(): number | undefined {
  if (typeof globalThis.sessionStorage === "undefined") {
    return undefined;
  }

  const rawValue = globalThis.sessionStorage.getItem(
    PROFILE_SUBSCRIPTIONS_PENDING_NAVIGATION_KEY
  );
  if (!rawValue) {
    return undefined;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as {
      expiresAt?: unknown;
    };
    return typeof parsedValue.expiresAt === "number"
      ? parsedValue.expiresAt
      : undefined;
  } catch {
    return undefined;
  }
}

function clearStoredPendingNavigation(): void {
  if (typeof globalThis.sessionStorage === "undefined") {
    return;
  }

  globalThis.sessionStorage.removeItem(
    PROFILE_SUBSCRIPTIONS_PENDING_NAVIGATION_KEY
  );
}

function getPendingNavigationRemainingMs(): number {
  const expiresAt = getPendingNavigationExpiresAt();
  if (!expiresAt) {
    clearStoredPendingNavigation();
    return 0;
  }

  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) {
    clearStoredPendingNavigation();
    return 0;
  }

  return remainingMs;
}

function hasPendingNavigation(): boolean {
  return getPendingNavigationRemainingMs() > 0;
}

function storePendingNavigation(): void {
  if (typeof globalThis.sessionStorage === "undefined") {
    return;
  }

  globalThis.sessionStorage.setItem(
    PROFILE_SUBSCRIPTIONS_PENDING_NAVIGATION_KEY,
    JSON.stringify({
      expiresAt: Date.now() + PROFILE_SUBSCRIPTIONS_CONNECT_TIMEOUT_MS,
    })
  );
}

export function useProfileSubscriptionsNavigation() {
  const { connectedProfile, isAuthenticated, requestAuth, setToast } =
    useAuth();
  const { seizeConnectFresh } = useSeizeConnectContext();
  const locale = useBrowserLocale();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [shouldNavigateAfterConnect, setShouldNavigateAfterConnect] =
    useState(hasPendingNavigation);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authRequestInFlightRef = useRef(false);
  const isConnectingRef = useRef(false);
  const shouldNavigateAfterConnectRef = useRef(shouldNavigateAfterConnect);

  const profileSubscriptionsHref = useMemo(
    () => getProfileSubscriptionsHref(connectedProfile),
    [connectedProfile]
  );
  const canNavigateToProfileSubscriptionsDirectly = !!(
    profileSubscriptionsHref && isAuthenticated
  );

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const clearPendingNavigation = useCallback(() => {
    clearConnectTimeout();
    clearStoredPendingNavigation();
    shouldNavigateAfterConnectRef.current = false;
    setShouldNavigateAfterConnect(false);
  }, [clearConnectTimeout]);

  const beginPendingNavigation = useCallback(() => {
    clearConnectTimeout();
    storePendingNavigation();
    shouldNavigateAfterConnectRef.current = true;
    setShouldNavigateAfterConnect(true);
  }, [clearConnectTimeout]);

  useEffect(() => {
    if (!shouldNavigateAfterConnect) {
      return undefined;
    }

    const remainingMs = getPendingNavigationRemainingMs();
    if (remainingMs <= 0) {
      clearPendingNavigation();
      return undefined;
    }

    connectTimeoutRef.current = setTimeout(() => {
      clearPendingNavigation();
    }, remainingMs);

    return clearConnectTimeout;
  }, [clearConnectTimeout, clearPendingNavigation, shouldNavigateAfterConnect]);

  const authenticateAndNavigate = useCallback(
    async (href: string): Promise<void> => {
      if (authRequestInFlightRef.current) {
        return;
      }

      authRequestInFlightRef.current = true;
      setIsConnecting(true);

      try {
        if (!isAuthenticated) {
          const { success } = await requestAuth();
          if (!success) {
            clearPendingNavigation();
            return;
          }
        }

        clearPendingNavigation();
        router.push(href);
      } catch (error) {
        clearPendingNavigation();
        console.error(
          "Failed to authenticate for profile subscriptions",
          error
        );
        setToast({
          message: t(locale, "home.mintSubscriptions.connectFailed"),
          type: "error",
        });
      } finally {
        authRequestInFlightRef.current = false;
        setIsConnecting(false);
      }
    },
    [
      clearPendingNavigation,
      isAuthenticated,
      locale,
      requestAuth,
      router,
      setToast,
    ]
  );

  const navigateAfterAuthenticatedConnect = useCallback(
    (href: string): void => {
      clearPendingNavigation();
      router.push(href);
    },
    [clearPendingNavigation, router]
  );

  useEffect(() => {
    if (
      !shouldNavigateAfterConnect ||
      !profileSubscriptionsHref ||
      !isAuthenticated
    ) {
      return;
    }

    navigateAfterAuthenticatedConnect(profileSubscriptionsHref);
  }, [
    isAuthenticated,
    navigateAfterAuthenticatedConnect,
    profileSubscriptionsHref,
    shouldNavigateAfterConnect,
  ]);

  const openProfileSubscriptions = useCallback(async (): Promise<void> => {
    if (profileSubscriptionsHref) {
      await authenticateAndNavigate(profileSubscriptionsHref);
      return;
    }

    if (
      isConnectingRef.current ||
      authRequestInFlightRef.current ||
      shouldNavigateAfterConnectRef.current
    ) {
      return;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    beginPendingNavigation();

    try {
      await seizeConnectFresh();
    } catch (error) {
      clearPendingNavigation();
      console.error("Failed to open wallet connection", error);
      setToast({
        message: t(locale, "home.mintSubscriptions.connectFailed"),
        type: "error",
      });
    } finally {
      isConnectingRef.current = false;
      if (!authRequestInFlightRef.current) {
        setIsConnecting(false);
      }
    }
  }, [
    authenticateAndNavigate,
    beginPendingNavigation,
    clearPendingNavigation,
    locale,
    profileSubscriptionsHref,
    seizeConnectFresh,
    setToast,
  ]);

  return {
    canNavigateToProfileSubscriptionsDirectly,
    isConnecting,
    openProfileSubscriptions,
    profileSubscriptionsHref,
  };
}
