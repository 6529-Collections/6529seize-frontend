"use client";

import {
  Bars3Icon,
  ChatBubbleLeftIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP } from "@/constants/constants";
import { useNavigationHistoryContext } from "@/contexts/NavigationHistoryContext";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { capitalizeEveryWord, formatAddress } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useWave } from "@/hooks/useWave";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveViewMode } from "@/hooks/useWaveViewMode";
import { useAuth } from "../auth/Auth";
import { getConnectionProfileIndicator } from "../auth/connection-state-indicator";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import BackButton from "../navigation/BackButton";
import Spinner from "../utils/Spinner";
import AppSidebar from "./AppSidebar";
import HeaderSearchButton from "./header-search/HeaderSearchButton";
import HeaderActionButtons from "./HeaderActionButtons";
import NetworkHealthCTA from "./NetworkHealthCTA";

const COLLECTION_TITLES: Record<string, string> = {
  "the-memes": "The Memes",
  "6529-gradient": "6529 Gradient",
  "meme-lab": "Meme Lab",
  nextgen: "NextGen",
};

const sliceString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  const half = Math.floor(length / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

const getCollectionTitle = (
  basePath: string,
  pageTitle: string
): string | null => {
  const prefix = COLLECTION_TITLES[basePath];
  if (prefix && !Number.isNaN(Number(pageTitle))) {
    return `${prefix} #${pageTitle}`;
  }
  return null;
};

const getRememesTitle = (pathSegments: string[]): string | null => {
  if (pathSegments[0] !== "rememes") return null;
  const contract = pathSegments[1];
  const tokenId = pathSegments[2];
  if (contract && tokenId) {
    return `Rememes ${formatAddress(contract)} #${sliceString(tokenId, 10)}`;
  }
  return null;
};

export default function AppHeader() {
  const PROFILE_DOUBLE_ACTIVATE_DELAY_MS = 280;
  const [menuOpen, setMenuOpen] = useState(false);
  const myStream = useMyStreamOptional();
  const {
    address,
    isAuthenticated,
    isConnected,
    connectedAccounts,
    seizeSwitchConnectedAccount,
  } = useSeizeConnectContext();
  const profileClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const { activeProfileProxy } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const { canGoBack } = useNavigationHistoryContext();
  const { profile } = useIdentity({
    handleOrWallet: address ?? null,
    initialProfile: null,
  });

  useEffect(
    () => () => {
      if (profileClickTimeoutRef.current) {
        clearTimeout(profileClickTimeoutRef.current);
      }
    },
    []
  );

  const pfp = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.pfp;
    return profile?.pfp ?? null;
  })();
  const resolvedPfp = pfp ? resolveIpfsUrlSync(pfp) : null;
  const menuAvatarSrc = resolvedPfp ?? DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP;

  const connectionIndicator = getConnectionProfileIndicator({
    isAuthenticated,
    isConnected,
  });

  const pathSegments = pathname.split("/").filter(Boolean);
  const basePath = pathSegments.length ? pathSegments[0] : "";
  const pageTitle = pathSegments.length
    ? pathSegments
        .at(-1)
        ?.replaceAll(/[-_]/g, " ")
        .replace(/^./, (c) => c.toUpperCase())
    : "Home";

  const waveId = myStream?.activeWave.id ?? null;
  const { wave, isLoading, isFetching } = useWaveById(waveId);

  const { viewMode, toggleViewMode } = useWaveViewMode(waveId ?? "");
  const { isRankWave, isMemesWave, isDm } = useWave(wave);
  const showGalleryToggle = !!waveId && !isRankWave && !isMemesWave && !isDm;

  const isWavesRoute = pathname === "/waves" || pathname.startsWith("/waves/");
  const isMessagesRoute =
    pathname === "/messages" || pathname.startsWith("/messages/");
  const isHomeRoute = pathname === "/";

  const isCreateRoute =
    pathname === "/waves/create" || pathname === "/messages/create";
  const isInsideWave = !!waveId;

  const isProfilePage = typeof params["user"] === "string";

  const showBackButton =
    isInsideWave || isCreateRoute || (isProfilePage && canGoBack);

  const pfpImage = (
    <div
      className={`tw-relative tw-h-10 tw-w-10 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full ${connectionIndicator.avatarClassName}`}
      title={connectionIndicator.title}
    >
      <Image
        src={menuAvatarSrc}
        alt="pfp"
        width={40}
        height={40}
        className={`tw-h-full tw-w-full tw-bg-iron-900 ${
          resolvedPfp ? "tw-object-contain" : "tw-object-cover tw-grayscale"
        }`}
      />
      {connectionIndicator.overlayClassName && (
        <div
          className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-rounded-full ${connectionIndicator.overlayClassName}`}
        />
      )}
    </div>
  );

  const pfpElement = address ? (
    pfpImage
  ) : (
    <Bars3Icon className="tw-size-6 tw-flex-shrink-0" />
  );

  const switchToNextConnectedAccount = (): boolean => {
    if (connectedAccounts.length < 2) {
      return false;
    }

    const activeIndex = connectedAccounts.findIndex(
      (account) => account.isActive
    );
    const currentIndex = Math.max(activeIndex, 0);
    const nextAccount =
      connectedAccounts[(currentIndex + 1) % connectedAccounts.length];
    if (!nextAccount) {
      return false;
    }

    seizeSwitchConnectedAccount(nextAccount.address);
    return true;
  };

  const onProfileActivate = () => {
    if (!address) {
      setMenuOpen(true);
      return;
    }

    if (profileClickTimeoutRef.current) {
      clearTimeout(profileClickTimeoutRef.current);
      profileClickTimeoutRef.current = null;

      const didSwitchAccount = switchToNextConnectedAccount();
      if (!didSwitchAccount) {
        setMenuOpen(true);
      }
      return;
    }

    profileClickTimeoutRef.current = setTimeout(() => {
      profileClickTimeoutRef.current = null;
      setMenuOpen(true);
    }, PROFILE_DOUBLE_ACTIVATE_DELAY_MS);
  };

  const finalTitle: React.ReactNode = (() => {
    if (pathname === "/waves/create") return "Waves";
    if (pathname === "/messages/create") return "Messages";
    if (isWavesRoute && !waveId) return "Waves";
    if (isMessagesRoute && !waveId) return "Messages";
    if (waveId) {
      if (isLoading || isFetching || wave?.id !== waveId) return <Spinner />;
      return wave.name;
    }

    const collectionTitle = getCollectionTitle(basePath!, pageTitle!);
    if (collectionTitle) return collectionTitle;

    const rememesTitle = getRememesTitle(pathSegments);
    if (rememesTitle) return rememesTitle;

    return sliceString(capitalizeEveryWord(pageTitle!), 20);
  })();

  return (
    <div className="tw-w-full tw-bg-black tw-pt-[env(safe-area-inset-top,0px)] tw-text-iron-50">
      <div className="tw-flex tw-h-16 tw-items-center tw-justify-between tw-px-4">
        {showBackButton && <BackButton />}
        {!showBackButton && (
          <button
            type="button"
            aria-label="Open menu"
            onClick={onProfileActivate}
            className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-transparent tw-bg-transparent"
          >
            {pfpElement}
          </button>
        )}
        <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-gap-2">
          <span className="tw-text-sm tw-font-semibold">{finalTitle}</span>
          {showGalleryToggle && (
            <button
              type="button"
              onClick={toggleViewMode}
              aria-label={
                viewMode === "chat"
                  ? "Switch to gallery view"
                  : "Switch to chat view"
              }
              className="tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300"
            >
              {viewMode === "chat" ? (
                <Squares2X2Icon className="tw-h-4 tw-w-4" />
              ) : (
                <ChatBubbleLeftIcon className="tw-h-4 tw-w-4" />
              )}
            </button>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <HeaderActionButtons />
          {isHomeRoute && <NetworkHealthCTA className="md:tw-hidden" />}
          <HeaderSearchButton
            wave={
              isInsideWave && (isWavesRoute || isMessagesRoute)
                ? (wave ?? null)
                : null
            }
          />
        </div>
      </div>
      <AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
