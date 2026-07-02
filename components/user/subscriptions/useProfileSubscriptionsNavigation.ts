"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProfileSubscriptionsHref } from "./subscriptionNavigation";

const PROFILE_SUBSCRIPTIONS_CONNECT_TIMEOUT_MS = 120_000;

export function useProfileSubscriptionsNavigation() {
  const { connectedProfile, setToast } = useAuth();
  const { seizeConnectFresh } = useSeizeConnectContext();
  const locale = useBrowserLocale();
  const router = useRouter();
  const [shouldNavigateAfterConnect, setShouldNavigateAfterConnect] =
    useState(false);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileSubscriptionsHref = useMemo(
    () => getProfileSubscriptionsHref(connectedProfile),
    [connectedProfile]
  );

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearConnectTimeout, [clearConnectTimeout]);

  useEffect(() => {
    if (!shouldNavigateAfterConnect || !profileSubscriptionsHref) {
      return;
    }

    clearConnectTimeout();
    setShouldNavigateAfterConnect(false);
    router.push(profileSubscriptionsHref);
  }, [
    clearConnectTimeout,
    profileSubscriptionsHref,
    router,
    shouldNavigateAfterConnect,
  ]);

  const openProfileSubscriptions = useCallback(async (): Promise<void> => {
    if (profileSubscriptionsHref) {
      router.push(profileSubscriptionsHref);
      return;
    }

    clearConnectTimeout();
    setShouldNavigateAfterConnect(true);
    connectTimeoutRef.current = setTimeout(() => {
      connectTimeoutRef.current = null;
      setShouldNavigateAfterConnect(false);
    }, PROFILE_SUBSCRIPTIONS_CONNECT_TIMEOUT_MS);

    try {
      await seizeConnectFresh();
    } catch (error) {
      clearConnectTimeout();
      setShouldNavigateAfterConnect(false);
      console.error("Failed to open wallet connection", error);
      setToast({
        message: t(locale, "home.mintSubscriptions.connectFailed"),
        type: "error",
      });
    }
  }, [
    clearConnectTimeout,
    locale,
    profileSubscriptionsHref,
    router,
    seizeConnectFresh,
    setToast,
  ]);

  return {
    openProfileSubscriptions,
    profileSubscriptionsHref,
  };
}
