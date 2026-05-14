"use client";

import {
  Bars3Icon,
  ChatBubbleLeftIcon,
  Squares2X2Icon,
  ShareIcon,
  LinkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP } from "@/constants/constants";
import { useNavigationHistoryContext } from "@/contexts/NavigationHistoryContext";
import {
  type HeaderWaveDropAction,
  useHeaderContext,
} from "@/contexts/HeaderContext";
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
import PrimaryButton from "../utils/button/PrimaryButton";
import { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";
import WaveDescriptionPopover from "@/components/waves/header/WaveDescriptionPopover";
import WavePicture from "@/components/waves/WavePicture";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import type { ApiWave } from "@/generated/models/ApiWave";

const COLLECTION_TITLES: Record<string, string> = {
  "the-memes": "The Memes",
  "6529-gradient": "6529 Gradient",
  "meme-lab": "Meme Lab",
  nextgen: "NextGen",
};
const PROFILE_DOUBLE_ACTIVATE_DELAY_MS = 280;

interface HeaderConnectedAccount {
  readonly address: string;
  readonly isActive: boolean;
}

interface HeaderTimeoutRef {
  current: ReturnType<typeof setTimeout> | null;
}

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

const getDropForgeTitle = (pathSegments: string[]): string | null => {
  if (pathSegments[0] !== "drop-forge") {
    return null;
  }

  const section = pathSegments[1];
  const claimId = pathSegments[2];

  if (section === "craft") {
    return claimId ? `Drop Forge - Craft #${claimId}` : "Drop Forge - Craft";
  }

  if (section === "launch") {
    return claimId ? `Drop Forge - Launch #${claimId}` : "Drop Forge - Launch";
  }

  return null;
};

const getHeaderTitle = ({
  pathname,
  waveId,
  wave,
  isWaveResolving,
  isWavesRoute,
  isMessagesRoute,
  basePath,
  pageTitle,
  pathSegments,
}: {
  readonly pathname: string;
  readonly waveId: string | null;
  readonly wave: { readonly name?: string | null } | null | undefined;
  readonly isWaveResolving: boolean;
  readonly isWavesRoute: boolean;
  readonly isMessagesRoute: boolean;
  readonly basePath: string;
  readonly pageTitle: string;
  readonly pathSegments: string[];
}): ReactNode => {
  if (pathname === "/waves/create") return "Waves";
  if (pathname === "/messages/create") return "Messages";
  if (isWavesRoute && !waveId) return "Waves";
  if (isMessagesRoute && !waveId) return "Messages";
  if (waveId) {
    if (isWaveResolving) return <Spinner />;
    return wave?.name;
  }

  const collectionTitle = getCollectionTitle(basePath, pageTitle);
  if (collectionTitle) return collectionTitle;

  const rememesTitle = getRememesTitle(pathSegments);
  if (rememesTitle) return rememesTitle;

  const dropForgeTitle = getDropForgeTitle(pathSegments);
  if (dropForgeTitle) return dropForgeTitle;

  return sliceString(capitalizeEveryWord(pageTitle), 20);
};

const HeaderTitleContent = ({
  activeWave,
  isWaveResolving,
  isDm,
  previewText,
  finalTitle,
}: {
  readonly activeWave: ApiWave | null;
  readonly isWaveResolving: boolean;
  readonly isDm: boolean;
  readonly previewText: string | null;
  readonly finalTitle: ReactNode;
}) => {
  if (activeWave === null || isWaveResolving) {
    return <span className="tw-text-sm tw-font-semibold">{finalTitle}</span>;
  }

  return (
    <div className="tw-flex tw-min-w-0 tw-max-w-[min(62vw,28rem)] tw-items-center tw-gap-2">
      <div className="tw-size-10 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-white/30">
        <WavePicture
          name={activeWave.name}
          picture={activeWave.picture ?? null}
          contributors={activeWave.contributors_overview.map((c) => ({
            pfp: c.contributor_pfp,
            identity: c.contributor_identity,
          }))}
        />
      </div>
      {!isDm && previewText !== null ? (
        <WaveDescriptionPopover
          wave={activeWave}
          align="center"
          ariaLabel="Show wave description"
          triggerClassName="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
        >
          <span className="tw-w-full tw-truncate tw-text-sm tw-font-semibold">
            {activeWave.name}
          </span>
          <span className="tw-w-full tw-truncate tw-text-xs tw-font-normal tw-text-iron-400">
            {previewText}
          </span>
        </WaveDescriptionPopover>
      ) : (
        <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold">
          {activeWave.name}
        </span>
      )}
    </div>
  );
};

const HeaderGalleryToggle = ({
  showGalleryToggle,
  viewMode,
  toggleViewMode,
}: {
  readonly showGalleryToggle: boolean;
  readonly viewMode: "chat" | "gallery";
  readonly toggleViewMode: () => void;
}) => {
  if (!showGalleryToggle) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleViewMode}
      aria-label={
        viewMode === "chat" ? "Switch to gallery view" : "Switch to chat view"
      }
      className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300"
    >
      {viewMode === "chat" ? (
        <Squares2X2Icon className="tw-h-5 tw-w-5" />
      ) : (
        <ChatBubbleLeftIcon className="tw-h-5 tw-w-5" />
      )}
    </button>
  );
};

const HeaderWaveLinkAction = ({
  showWaveLinkAction,
  handleWaveLinkActionClick,
  waveLinkActionLabel,
  waveLinkActionMode,
  waveLinkActionIconColor,
  renderWaveLinkActionIcon,
}: {
  readonly showWaveLinkAction: boolean;
  readonly handleWaveLinkActionClick: () => void;
  readonly waveLinkActionLabel: string;
  readonly waveLinkActionMode: string;
  readonly waveLinkActionIconColor: string;
  readonly renderWaveLinkActionIcon: () => ReactNode;
}) => {
  if (!showWaveLinkAction) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleWaveLinkActionClick}
      aria-label={waveLinkActionLabel}
      title={waveLinkActionLabel}
      data-wave-link-action-mode={waveLinkActionMode}
      className={`tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 ${waveLinkActionIconColor}`}
    >
      {renderWaveLinkActionIcon()}
    </button>
  );
};

const HeaderDropActionButton = ({
  action,
}: {
  readonly action: HeaderWaveDropAction | null;
}) => {
  if (!action) {
    return null;
  }

  const title = action.restrictionMessage ?? action.label;

  return (
    <PrimaryButton
      loading={false}
      disabled={!action.canOpen}
      onClicked={action.onOpen}
      padding="tw-px-2.5 tw-py-2"
      title={title}
      ariaLabel={action.label}
    >
      <PlusIcon className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0" />
      <span>{action.compactLabel}</span>
    </PrimaryButton>
  );
};

const getHeaderDropAction = ({
  activeWave,
  waveDropAction,
}: {
  readonly activeWave: ApiWave | null;
  readonly waveDropAction: HeaderWaveDropAction | null;
}): HeaderWaveDropAction | null => {
  if (!activeWave || waveDropAction?.waveId !== activeWave.id) {
    return null;
  }

  return waveDropAction;
};

const switchToNextConnectedAccount = ({
  connectedAccounts,
  seizeSwitchConnectedAccount,
  onFailure,
}: {
  readonly connectedAccounts: readonly HeaderConnectedAccount[];
  readonly seizeSwitchConnectedAccount: (address: string) => void;
  readonly onFailure: (error: unknown) => void;
}): boolean => {
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

  try {
    seizeSwitchConnectedAccount(nextAccount.address);
    return true;
  } catch (error) {
    onFailure(error);
    return false;
  }
};

const handleProfileActivate = ({
  address,
  profileClickTimeoutRef,
  openMenu,
  switchConnectedAccount,
}: {
  readonly address: string | null | undefined;
  readonly profileClickTimeoutRef: HeaderTimeoutRef;
  readonly openMenu: () => void;
  readonly switchConnectedAccount: () => boolean;
}) => {
  if (!address) {
    openMenu();
    return;
  }

  if (profileClickTimeoutRef.current) {
    clearTimeout(profileClickTimeoutRef.current);
    profileClickTimeoutRef.current = null;

    if (!switchConnectedAccount()) {
      openMenu();
    }
    return;
  }

  profileClickTimeoutRef.current = setTimeout(() => {
    profileClickTimeoutRef.current = null;
    openMenu();
  }, PROFILE_DOUBLE_ACTIVATE_DELAY_MS);
};

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const myStream = useMyStreamOptional();
  const { waveDropAction } = useHeaderContext();
  const {
    address,
    isAuthenticated,
    isConnected,
    connectedAccounts,
    connectedAccountUnreadNotifications,
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
  const hasUnreadOnOtherConnectedProfiles = connectedAccounts.some(
    (account) =>
      !account.isActive &&
      (connectedAccountUnreadNotifications[account.address.toLowerCase()] ??
        0) > 0
  );

  const pathSegments = pathname.split("/").filter(Boolean);
  const basePath = pathSegments[0] ?? "";
  const pageTitle =
    pathSegments
      .at(-1)
      ?.replaceAll(/[-_]/g, " ")
      .replace(/^./, (c) => c.toUpperCase()) ?? "Home";

  const waveId = myStream?.activeWave.id ?? null;
  const { wave, isLoading, isFetching } = useWaveById(waveId);
  const activeWave = waveId && wave?.id === waveId ? wave : null;
  const headerDropAction = getHeaderDropAction({ activeWave, waveDropAction });

  const { viewMode, toggleViewMode } = useWaveViewMode(waveId ?? "");
  const { isRankWave, isMemesWave, isDm } = useWave(activeWave);
  const showGalleryToggle = !!waveId && !isRankWave && !isMemesWave && !isDm;
  const showWaveLinkAction = Boolean(activeWave && !isDm);
  const previewText = getWaveDescriptionPreviewText(activeWave);
  const {
    mode: waveLinkActionMode,
    label: waveLinkActionLabel,
    feedbackState: waveLinkActionFeedbackState,
    onClick: handleWaveLinkActionClick,
  } = useWaveShareCopyAction({
    waveId: waveId ?? "",
    waveName: activeWave?.name ?? "",
    isDirectMessage: activeWave ? isDm : false,
  });
  const waveLinkActionIconColor =
    waveLinkActionFeedbackState === "idle"
      ? "tw-text-iron-300"
      : "tw-text-emerald-300";
  const renderWaveLinkActionIcon = () => {
    if (waveLinkActionFeedbackState !== "idle") {
      return <CheckIcon className="tw-h-5 tw-w-5" />;
    }

    if (waveLinkActionMode === "share") {
      return <ShareIcon className="tw-h-5 tw-w-5" />;
    }

    return <LinkIcon className="tw-h-5 tw-w-5" />;
  };

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
  const isWaveResolving =
    !!waveId && (isLoading || isFetching || wave?.id !== waveId);

  const pfpImage = (
    <div className="tw-relative tw-h-10 tw-w-10 tw-flex-shrink-0">
      <div
        className={`tw-relative tw-h-10 tw-w-10 tw-overflow-hidden tw-rounded-full ${connectionIndicator.avatarClassName}`}
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
      {hasUnreadOnOtherConnectedProfiles && (
        <div
          className="tw-absolute tw-right-[-3px] tw-top-[-3px] tw-size-3 tw-rounded-full tw-bg-indigo-500 tw-shadow-sm"
          aria-hidden="true"
        />
      )}
    </div>
  );

  const pfpElement = address ? (
    pfpImage
  ) : (
    <Bars3Icon className="tw-size-6 tw-flex-shrink-0" />
  );
  const hasMultipleConnectedAccounts = connectedAccounts.length > 1;
  const openMenu = () => setMenuOpen(true);
  const onProfileActivate = () =>
    handleProfileActivate({
      address,
      profileClickTimeoutRef,
      openMenu,
      switchConnectedAccount: () =>
        switchToNextConnectedAccount({
          connectedAccounts,
          seizeSwitchConnectedAccount,
          onFailure: (error) => {
            console.error(
              "Failed to switch connected account from header",
              error
            );
          },
        }),
    });

  const finalTitle = getHeaderTitle({
    pathname,
    waveId,
    wave,
    isWaveResolving,
    isWavesRoute,
    isMessagesRoute,
    basePath,
    pageTitle,
    pathSegments,
  });

  return (
    <div className="tw-w-full tw-bg-black tw-pt-[env(safe-area-inset-top,0px)] tw-text-iron-50">
      <div className="tw-flex tw-h-16 tw-items-center tw-justify-between tw-px-4">
        {showBackButton && <BackButton />}
        {!showBackButton && (
          <button
            type="button"
            aria-label={
              hasMultipleConnectedAccounts
                ? "Open menu (double-click to switch accounts)"
                : "Open menu"
            }
            onClick={onProfileActivate}
            className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-transparent tw-bg-transparent"
          >
            {pfpElement}
          </button>
        )}
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-center tw-gap-2">
          <HeaderTitleContent
            activeWave={activeWave}
            isWaveResolving={isWaveResolving}
            isDm={isDm}
            previewText={previewText}
            finalTitle={finalTitle}
          />
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-justify-end tw-gap-x-1">
          <HeaderDropActionButton action={headerDropAction} />
          <HeaderGalleryToggle
            showGalleryToggle={showGalleryToggle}
            viewMode={viewMode}
            toggleViewMode={toggleViewMode}
          />
          <div className="tw-flex-shrink-0">
            <HeaderActionButtons />
          </div>
          {isHomeRoute && <NetworkHealthCTA className="md:tw-hidden" />}
          <HeaderWaveLinkAction
            showWaveLinkAction={showWaveLinkAction}
            handleWaveLinkActionClick={handleWaveLinkActionClick}
            waveLinkActionLabel={waveLinkActionLabel}
            waveLinkActionMode={waveLinkActionMode}
            waveLinkActionIconColor={waveLinkActionIconColor}
            renderWaveLinkActionIcon={renderWaveLinkActionIcon}
          />
          <div className="tw-flex-shrink-0">
            <HeaderSearchButton
              wave={
                isInsideWave && (isWavesRoute || isMessagesRoute)
                  ? (wave ?? null)
                  : null
              }
            />
          </div>
        </div>
      </div>
      <AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
