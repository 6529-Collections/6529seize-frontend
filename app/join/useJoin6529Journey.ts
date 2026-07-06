import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import type { SupportedLocale } from "@/i18n/locales";
import { commonApiFetch } from "@/services/api/common-api";

import {
  getProfileHref,
  getProfileRouteIdentity,
  hasEstablishedProfileActivity,
  isPublicWaveDropByProfile,
} from "./journeyIdentity";
import {
  completePanel,
  profileImagePanel,
  profilePanel,
  wavesPanel,
} from "./journeyPanels";
import { WAVES_ENTRY_STORAGE_PREFIX } from "./page.content";
import type { CurrentPanelContent } from "./page.types";
import { m } from "./page.utils";
import { useJoin6529Progress } from "./useJoin6529Progress";

interface CurrentPanelArgs {
  readonly authActionError: string | null;
  readonly authActionPending: boolean;
  readonly fetchingProfile: boolean;
  readonly hasActiveWalletAddress: boolean;
  readonly hasEnteredWaves: boolean;
  readonly hasFirstPublicMessage: boolean;
  readonly hasProfile: boolean;
  readonly hasProfileImage: boolean;
  readonly hasValidWalletAuth: boolean;
  readonly locale: SupportedLocale;
  readonly onConnectWallet: () => void;
  readonly onMarkWavesEntered: () => void;
  readonly onRequestAuth: () => void;
  readonly profileHref: string;
  readonly walletActionError: string | null;
  readonly walletActionPending: boolean;
}

const getProfileQueryIdentity = (profile: ApiIdentity | null): string | null =>
  profile?.handle ??
  profile?.normalised_handle ??
  profile?.primary_wallet ??
  null;

const getProfileStorageKey = (
  profile: ApiIdentity | null,
  address: string | undefined
): string | null => {
  const primaryWallet = profile?.primary_wallet;
  return (
    profile?.id ??
    profile?.normalised_handle ??
    profile?.handle ??
    primaryWallet?.toLowerCase() ??
    address?.toLowerCase() ??
    null
  );
};

const readWavesEntry = (storageKey: string | null): boolean =>
  storageKey !== null && safeLocalStorage.getItem(storageKey) === "1";

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
  const [walletActionError, setWalletActionError] = useState<string | null>(
    null
  );
  const [authActionError, setAuthActionError] = useState<string | null>(null);
  const [enteredWavesStorageKeys, setEnteredWavesStorageKeys] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const profileRouteIdentity = getProfileRouteIdentity(
    connectedProfile,
    address
  );
  const profileHref = getProfileHref(connectedProfile, address);
  const subscriptionsHref =
    profileRouteIdentity !== null
      ? `/${profileRouteIdentity}/subscriptions`
      : "/open-data/meme-subscriptions";
  const profileQueryIdentity = getProfileQueryIdentity(connectedProfile);
  const profileStorageKey = getProfileStorageKey(connectedProfile, address);
  const wavesEntryStorageKey =
    profileStorageKey !== null
      ? `${WAVES_ENTRY_STORAGE_PREFIX}${profileStorageKey}`
      : null;
  const hasProfile = connectedProfile !== null;
  const hasProfileImage = Boolean(connectedProfile?.pfp);
  const hasEstablishedActivity =
    hasEstablishedProfileActivity(connectedProfile);
  const hasFirstPublicMessage = useFirstPublicMessage({
    connectedProfile,
    hasEstablishedActivity,
    profileQueryIdentity,
  });
  const hasEnteredWavesFromGuide =
    readWavesEntry(wavesEntryStorageKey) ||
    (wavesEntryStorageKey !== null &&
      enteredWavesStorageKeys.has(wavesEntryStorageKey));
  const hasEnteredWaves = hasFirstPublicMessage || hasEnteredWavesFromGuide;
  const timelineProgress = useJoin6529Progress({
    connectedProfile,
    hasActiveWalletAddress,
    hasEnteredWaves,
    hasFirstPublicMessage,
    hasProfile,
    isProfileStateReady: hasValidWalletAuth && !fetchingProfile,
  });

  const handleConnectWallet = useCallback(() => {
    setWalletActionPending(true);
    setWalletActionError(null);
    void (async () => {
      try {
        await seizeConnectFresh();
      } catch {
        setWalletActionError(m(locale, "join6529.current.wallet.error"));
      } finally {
        setWalletActionPending(false);
      }
    })();
  }, [locale, seizeConnectFresh]);

  const handleRequestAuth = useCallback(() => {
    setAuthActionPending(true);
    setAuthActionError(null);
    void (async () => {
      try {
        const { success } = await requestAuth();
        if (!success) {
          setAuthActionError(m(locale, "join6529.current.auth.error"));
        }
      } catch {
        setAuthActionError(m(locale, "join6529.current.auth.error"));
      } finally {
        setAuthActionPending(false);
      }
    })();
  }, [locale, requestAuth]);

  const markWavesEntered = useCallback(() => {
    if (wavesEntryStorageKey === null) {
      return;
    }

    safeLocalStorage.setItem(wavesEntryStorageKey, "1");
    setEnteredWavesStorageKeys((storageKeys) => {
      if (storageKeys.has(wavesEntryStorageKey)) {
        return storageKeys;
      }
      const nextStorageKeys = new Set(storageKeys);
      nextStorageKeys.add(wavesEntryStorageKey);
      return nextStorageKeys;
    });
  }, [wavesEntryStorageKey]);

  const currentPanel = getCurrentPanel({
    authActionError,
    authActionPending,
    fetchingProfile,
    hasActiveWalletAddress,
    hasEnteredWaves,
    hasFirstPublicMessage,
    hasProfile,
    hasProfileImage,
    hasValidWalletAuth,
    locale,
    onConnectWallet: handleConnectWallet,
    onMarkWavesEntered: markWavesEntered,
    onRequestAuth: handleRequestAuth,
    profileHref,
    walletActionError,
    walletActionPending,
  });

  return {
    currentPanel,
    profileHref,
    subscriptionsHref,
    timelineProgress,
  };
}

function useFirstPublicMessage({
  connectedProfile,
  hasEstablishedActivity,
  profileQueryIdentity,
}: {
  readonly connectedProfile: ApiIdentity | null;
  readonly hasEstablishedActivity: boolean;
  readonly profileQueryIdentity: string | null;
}) {
  const { data: recentProfileDrops } = useQuery({
    queryKey: [
      QueryKey.PROFILE_DROPS,
      "join-6529-first-public-message",
      profileQueryIdentity,
    ],
    enabled: profileQueryIdentity !== null && !hasEstablishedActivity,
    staleTime: 60_000,
    queryFn: async () => {
      if (profileQueryIdentity === null) {
        return [];
      }
      return await commonApiFetch<ApiDrop[]>({
        endpoint: "/drops",
        params: {
          limit: "10",
          author: profileQueryIdentity,
          include_replies: "true",
          context_profile: profileQueryIdentity,
        },
      });
    },
  });

  const hasRecentPublicMessage = Boolean(
    recentProfileDrops?.some((drop) =>
      isPublicWaveDropByProfile(drop, connectedProfile)
    )
  );
  return hasEstablishedActivity || hasRecentPublicMessage;
}

function getCurrentPanel(args: CurrentPanelArgs): CurrentPanelContent {
  if (!args.hasActiveWalletAddress) {
    return {
      title: m(args.locale, "join6529.current.wallet.title"),
      body: m(args.locale, "join6529.current.wallet.body"),
      error: args.walletActionError,
      action: {
        kind: "button",
        label: m(args.locale, "join6529.action.connect"),
        busyLabel: m(args.locale, "join6529.action.connecting"),
        busy: args.walletActionPending,
        onClick: args.onConnectWallet,
      },
    };
  }

  if (!args.hasValidWalletAuth) {
    return {
      title: m(args.locale, "join6529.current.auth.title"),
      body: m(args.locale, "join6529.current.auth.body"),
      error: args.authActionError,
      action: {
        kind: "button",
        label: m(args.locale, "join6529.action.sign"),
        busyLabel: m(args.locale, "join6529.action.signing"),
        busy: args.authActionPending,
        onClick: args.onRequestAuth,
      },
    };
  }

  if (args.fetchingProfile) {
    return {
      title: m(args.locale, "join6529.current.profile.loadingTitle"),
      body: m(args.locale, "join6529.current.profile.loadingBody"),
    };
  }

  if (!args.hasProfile) {
    return profilePanel(args.locale, args.profileHref);
  }
  if (!args.hasEnteredWaves || !args.hasFirstPublicMessage) {
    return wavesPanel(
      args.locale,
      args.onMarkWavesEntered,
      !args.hasEnteredWaves
    );
  }
  if (!args.hasProfileImage) {
    return profileImagePanel(args.locale, args.profileHref);
  }
  return completePanel(args.locale);
}
