"use client";

import { useAuth } from "@/components/auth/Auth";
import { isAuthResolving } from "@/components/auth/authResolution";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Join6529Icon from "@/components/common/icons/Join6529Icon";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useMemo } from "react";
import { ServerStackIcon } from "@heroicons/react/24/outline";

/** Use the same profile-backed membership decision as the auth provider. */
export function useMembershipNavigation() {
  const { connectedProfile, isAuthenticated, fetchingProfile } = useAuth();
  const { address, connectionState } = useSeizeConnectContext();
  const hasHydrated = useHasHydrated();
  const isPending =
    !hasHydrated ||
    isAuthResolving(connectionState, fetchingProfile) ||
    // A successful profileless lookup still returns an identity. Null is unresolved,
    // including a failed lookup; do not mistake that for a newcomer.
    (!!address && !connectedProfile);
  // SSR and unresolved sessions must never publish a Validator navigation link.
  const isMember = !isPending && isAuthenticated === true;

  return useMemo(
    () => ({
      href: isMember ? "/validator" : "/join-6529",
      label: t(
        DEFAULT_LOCALE,
        isMember
          ? "navigation.primary.validator"
          : "navigation.primary.join6529"
      ),
      icon: isMember ? ServerStackIcon : Join6529Icon,
      isPending,
    }),
    [isMember, isPending]
  );
}
