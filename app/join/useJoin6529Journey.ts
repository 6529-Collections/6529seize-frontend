import { useCallback, useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { SupportedLocale } from "@/i18n/locales";

import { getProfileHref, getProfileRouteIdentity } from "./journeyIdentity";
import { SUBSCRIPTIONS_INFO_HREF, WAVES_HREF } from "./page.content";
import type { CurrentPanelAction, JoinPageState } from "./page.types";
import { m } from "./page.utils";
import { useJoin6529Progress } from "./useJoin6529Progress";

export function useJoin6529Journey(locale: SupportedLocale) {
  const { connectedProfile, fetchingProfile, requestAuth } = useAuth();
  const {
    address,
    hasActiveWalletAddress,
    hasValidWalletAuth,
    seizeConnectFresh,
  } = useSeizeConnectContext();
  const [walletActionPending, setWalletActionPending] = useState(false);
  const [authActionPending, setAuthActionPending] = useState(false);

  const profileHref = getProfileHref(connectedProfile, address);
  const subscriptionProfileIdentity = getProfileRouteIdentity(
    connectedProfile,
    undefined
  );
  const subscriptionsHref =
    subscriptionProfileIdentity === null
      ? SUBSCRIPTIONS_INFO_HREF
      : `/${subscriptionProfileIdentity}/subscriptions`;
  const pageState = getJoinPageState({
    hasActiveWalletAddress,
    hasProfile: Boolean(connectedProfile),
  });
  const timelineProgress = useJoin6529Progress({ pageState });

  const handleConnectWallet = useCallback(() => {
    setWalletActionPending(true);
    void (async () => {
      try {
        await seizeConnectFresh();
      } catch {
        // The wallet modal can be dismissed; the user can retry the CTA.
      } finally {
        setWalletActionPending(false);
      }
    })();
  }, [seizeConnectFresh]);

  const handleRequestAuth = useCallback(() => {
    setAuthActionPending(true);
    void (async () => {
      try {
        await requestAuth();
      } catch {
        // Signing can be cancelled; the setup CTA remains available.
      } finally {
        setAuthActionPending(false);
      }
    })();
  }, [requestAuth]);

  const primaryAction = getHeroPrimaryAction({
    authActionPending,
    fetchingProfile,
    hasValidWalletAuth,
    locale,
    onConnectWallet: handleConnectWallet,
    onRequestAuth: handleRequestAuth,
    pageState,
    profileHref,
    walletActionPending,
  });
  const secondaryAction = getHeroSecondaryAction({
    locale,
    pageState,
    subscriptionsHref,
  });

  return {
    pageState,
    primaryAction,
    profileHref,
    secondaryAction,
    subscriptionsHref,
    timelineProgress,
  };
}

function getJoinPageState({
  hasActiveWalletAddress,
  hasProfile,
}: {
  readonly hasActiveWalletAddress: boolean;
  readonly hasProfile: boolean;
}): JoinPageState {
  if (!hasActiveWalletAddress) {
    return "loggedOut";
  }

  return hasProfile ? "loggedIn" : "inProgress";
}

function getHeroPrimaryAction({
  authActionPending,
  fetchingProfile,
  hasValidWalletAuth,
  locale,
  onConnectWallet,
  onRequestAuth,
  pageState,
  profileHref,
  walletActionPending,
}: {
  readonly authActionPending: boolean;
  readonly fetchingProfile: boolean;
  readonly hasValidWalletAuth: boolean;
  readonly locale: SupportedLocale;
  readonly onConnectWallet: () => void;
  readonly onRequestAuth: () => void;
  readonly pageState: JoinPageState;
  readonly profileHref: string;
  readonly walletActionPending: boolean;
}): CurrentPanelAction {
  if (pageState === "loggedOut") {
    return {
      kind: "button",
      label: m(locale, "join6529.action.connect"),
      busyLabel: m(locale, "join6529.action.connecting"),
      busy: walletActionPending,
      onClick: onConnectWallet,
    };
  }

  if (pageState === "inProgress" && !hasValidWalletAuth) {
    return {
      kind: "button",
      label: m(locale, "join6529.action.setupProfile"),
      busyLabel: m(locale, "join6529.action.signing"),
      busy: authActionPending,
      onClick: onRequestAuth,
    };
  }

  if (pageState === "inProgress" && fetchingProfile) {
    return {
      kind: "button",
      label: m(locale, "join6529.action.setupProfile"),
      busyLabel: m(locale, "join6529.action.setupProfile"),
      busy: true,
    };
  }

  if (pageState === "inProgress") {
    return {
      kind: "link",
      label: m(locale, "join6529.action.setupProfile"),
      href: profileHref,
    };
  }

  return {
    kind: "link",
    label: m(locale, "join6529.action.goToWaves"),
    href: WAVES_HREF,
  };
}

function getHeroSecondaryAction({
  locale,
  pageState,
  subscriptionsHref,
}: {
  readonly locale: SupportedLocale;
  readonly pageState: JoinPageState;
  readonly subscriptionsHref: string;
}): CurrentPanelAction {
  if (pageState === "loggedIn") {
    return {
      kind: "link",
      label: m(locale, "join6529.action.subscribeToDrops"),
      href: subscriptionsHref,
    };
  }

  return {
    kind: "link",
    label: m(
      locale,
      pageState === "loggedOut"
        ? "join6529.action.explorePaths"
        : "join6529.action.skipForNow"
    ),
    href: "#journey",
  };
}
