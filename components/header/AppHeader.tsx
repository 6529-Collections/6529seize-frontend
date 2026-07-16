"use client";

import {
  Bars3Icon,
  EllipsisHorizontalIcon,
  LockClosedIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CompactMenu } from "@/components/compact-menu";
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
import useCapacitor from "@/hooks/useCapacitor";
import { useWave } from "@/hooks/useWave";
import { useWaveViewMode } from "@/hooks/useWaveViewMode";
import { useAuth } from "../auth/Auth";
import { getConnectionProfileIndicator } from "../auth/connection-state-indicator";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import BackButton from "../navigation/BackButton";
import Spinner from "../utils/Spinner";
import AppSidebar from "./AppSidebar";
import HeaderSearchButton from "./header-search/HeaderSearchButton";
import HeaderPageShareButton from "./share/HeaderPageShareButton";
import HeaderActionButtons from "./HeaderActionButtons";
import NetworkHealthCTA from "./NetworkHealthCTA";
import PrimaryButton from "../utils/button/PrimaryButton";
import { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";
import WaveDescriptionPopover from "@/components/waves/header/WaveDescriptionPopover";
import WavePicture from "@/components/waves/WavePicture";
import { getDirectMessageProfileHref } from "@/helpers/waves/direct-message-profile.helpers";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getActiveViewFromUrl } from "../navigation/ViewContext";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import {
  getAppHeaderMoreMenuItems,
  type HeaderMoreMenuItem,
} from "./app-header-more-menu-items";
import {
  type HeaderWavePreview,
  useHeaderActiveWave,
} from "./app-header-wave-preview";
import WaveHeaderRestrictionButton from "@/components/waves/header/WaveHeaderRestrictionButton";
import MainStageNominationPopover from "@/components/brain/my-stream/tabs/MainStageNominationPopover";

const COLLECTION_TITLES: Record<string, string> = {
  "the-memes": "The Memes",
  "6529-gradient": "6529 Gradient",
  "meme-lab": "Meme Lab",
  nextgen: "NextGen",
};
const PROFILE_DOUBLE_ACTIVATE_DELAY_MS = 280;
const HEADER_RESTRICTION_BUTTON_CLASS =
  "tw-size-9 tw-min-w-9 tw-rounded-lg tw-border-0 tw-bg-black tw-p-0 tw-text-iron-300 tw-shadow-sm desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50";

interface HeaderConnectedAccount {
  readonly address: string;
  readonly isActive: boolean;
}

interface HeaderTimeoutRef {
  current: ReturnType<typeof setTimeout> | null;
}

interface HeaderProfileSource {
  readonly pfp?: string | null;
}

interface HeaderActiveProfileProxySource {
  readonly created_by: HeaderProfileSource;
}

interface HeaderConnectedProfileSource {
  readonly pfp?: string | null;
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

const shouldShowHeaderPageShareAction = ({
  activeView,
  isCapacitor,
  pathname,
}: {
  readonly activeView: string | null;
  readonly isCapacitor: boolean;
  readonly pathname: string;
}): boolean => {
  if (!isCapacitor) {
    return false;
  }

  if (
    pathname === "/" ||
    pathname === "/waves" ||
    pathname.startsWith("/waves/") ||
    pathname === "/messages" ||
    pathname.startsWith("/messages/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/")
  ) {
    return false;
  }

  return activeView !== "waves" && activeView !== "messages";
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

const getHeaderProfilePfp = ({
  activeProfileProxy,
  profile,
}: {
  readonly activeProfileProxy:
    | HeaderActiveProfileProxySource
    | null
    | undefined;
  readonly profile: HeaderConnectedProfileSource | null | undefined;
}): string | null => {
  if (activeProfileProxy) {
    return activeProfileProxy.created_by.pfp ?? null;
  }

  return profile?.pfp ?? null;
};

const getHasUnreadOnOtherConnectedProfiles = ({
  connectedAccounts,
  connectedAccountUnreadNotifications,
}: {
  readonly connectedAccounts: readonly HeaderConnectedAccount[];
  readonly connectedAccountUnreadNotifications: Readonly<
    Record<string, number>
  >;
}): boolean =>
  connectedAccounts.some(
    (account) =>
      !account.isActive &&
      (connectedAccountUnreadNotifications[account.address.toLowerCase()] ??
        0) > 0
  );

const HeaderTitleContent = ({
  displayWave,
  activeWave,
  isDm,
  directMessageProfileHref,
  previewText,
  finalTitle,
}: {
  readonly displayWave: HeaderWavePreview | null;
  readonly activeWave: ApiWave | null;
  readonly isDm: boolean;
  readonly directMessageProfileHref: string | null;
  readonly previewText: string | null;
  readonly finalTitle: ReactNode;
}) => {
  if (displayWave === null) {
    return <span className="tw-text-sm tw-font-semibold">{finalTitle}</span>;
  }

  const wavePicture = (
    <div className="tw-size-9 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-white/30">
      <WavePicture
        name={displayWave.name}
        picture={displayWave.picture}
        contributors={displayWave.contributors}
      />
    </div>
  );
  const directMessageProfileLink =
    activeWave !== null && isDm ? directMessageProfileHref : null;

  return (
    <div className="tw-flex tw-min-w-0 tw-max-w-[min(62vw,28rem)] tw-items-center tw-gap-2">
      {directMessageProfileLink !== null ? (
        <Link
          href={directMessageProfileLink}
          aria-label={`View ${displayWave.name}'s profile`}
          className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-iron-50 tw-no-underline tw-transition-colors desktop-hover:hover:tw-text-white"
        >
          {wavePicture}
          <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold">
            {displayWave.name}
          </span>
        </Link>
      ) : (
        <>
          {wavePicture}
          {activeWave !== null && !isDm && previewText !== null ? (
            <WaveDescriptionPopover
              wave={activeWave}
              align="left"
              ariaLabel="Show wave description"
              triggerClassName="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
            >
              <span className="tw-w-full tw-truncate tw-text-sm tw-font-semibold">
                {displayWave.name}
              </span>
              <span className="tw-hidden tw-w-full tw-truncate tw-text-xs tw-font-normal tw-text-iron-400 sm:tw-block">
                {previewText}
              </span>
            </WaveDescriptionPopover>
          ) : (
            <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold">
              {displayWave.name}
            </span>
          )}
        </>
      )}
    </div>
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

  if (!action.canOpen) {
    if (action.restrictionKind === "memes-nomination") {
      return (
        <MainStageNominationPopover>
          <button
            type="button"
            aria-label={action.label}
            aria-haspopup="dialog"
            className={clsx(
              "tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-transition tw-duration-150 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400",
              HEADER_RESTRICTION_BUTTON_CLASS
            )}
          >
            <LockClosedIcon className="tw-size-5 tw-flex-shrink-0" />
            <span className="tw-sr-only">{action.compactLabel}</span>
          </button>
        </MainStageNominationPopover>
      );
    }

    return (
      <WaveHeaderRestrictionButton
        label={action.label}
        reason={title}
        className={HEADER_RESTRICTION_BUTTON_CLASS}
      >
        <LockClosedIcon className="tw-size-5 tw-flex-shrink-0" />
        <span className="tw-sr-only">{action.compactLabel}</span>
      </WaveHeaderRestrictionButton>
    );
  }

  return (
    <PrimaryButton
      loading={false}
      disabled={false}
      onClicked={action.onOpen}
      padding="tw-p-0 sm:tw-px-2.5 sm:tw-py-2"
      title={title}
      ariaLabel={action.label}
      className="tw-size-9 tw-min-w-9 tw-p-0"
    >
      <PlusIcon className="tw-size-5 tw-flex-shrink-0" />
      <span className="tw-sr-only">{action.compactLabel}</span>
    </PrimaryButton>
  );
};

function getDirectActionLabel(
  item: HeaderMoreMenuItem | null
): string | undefined {
  if (!item || item.kind === "section") {
    return undefined;
  }

  if (item.ariaLabel) {
    return item.ariaLabel;
  }

  return typeof item.label === "string" ? item.label : undefined;
}

const HeaderMoreMenu = ({
  items,
}: {
  readonly items: readonly HeaderMoreMenuItem[];
}) => {
  if (items.length === 0) {
    return null;
  }

  const onlyItem = items.length === 1 ? (items[0] ?? null) : null;
  const directActionLabel = getDirectActionLabel(onlyItem);
  if (
    onlyItem &&
    onlyItem.kind !== "section" &&
    onlyItem.renderAsDirectButton &&
    directActionLabel
  ) {
    return (
      <button
        type="button"
        aria-label={directActionLabel}
        title={directActionLabel}
        onClick={onlyItem.onSelect}
        disabled={onlyItem.disabled}
        aria-busy={onlyItem.directActionActive ? "true" : undefined}
        className={clsx(
          "tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50",
          onlyItem.directActionActive
            ? "tw-scale-95 tw-bg-iron-800 tw-text-iron-50 tw-ring-1 tw-ring-primary-400"
            : "tw-bg-black tw-text-iron-300 hover:tw-text-iron-50"
        )}
      >
        {onlyItem.directIcon ?? onlyItem.icon}
      </button>
    );
  }

  return (
    <CompactMenu
      aria-label="More header actions"
      className="tw-flex-shrink-0"
      unstyledTrigger
      triggerClassName="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-black tw-text-iron-300 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      trigger={
        <>
          <span className="tw-sr-only">More header actions</span>
          <EllipsisHorizontalIcon className="tw-size-5 tw-flex-shrink-0" />
        </>
      }
      items={items}
      menuWidthClassName="tw-w-56"
    />
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
  const { isCapacitor } = useCapacitor();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();
  const {
    address,
    hasValidWalletAuth,
    isConnected,
    connectedAccounts,
    connectedAccountUnreadNotifications,
    seizeSwitchConnectedAccount,
  } = useSeizeConnectContext();
  const profileClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const { connectedProfile, activeProfileProxy } = useAuth();
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

  const pfp = getHeaderProfilePfp({ activeProfileProxy, profile });
  const resolvedPfp = pfp ? resolveIpfsUrlSync(pfp) : null;
  const menuAvatarSrc = resolvedPfp ?? DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP;

  const connectionIndicator = getConnectionProfileIndicator({
    isAuthenticated: hasValidWalletAuth,
    isConnected,
  });
  const hasUnreadOnOtherConnectedProfiles =
    getHasUnreadOnOtherConnectedProfiles({
      connectedAccounts,
      connectedAccountUnreadNotifications,
    });

  const pathSegments = pathname.split("/").filter(Boolean);
  const basePath = pathSegments[0] ?? "";
  const pageTitle =
    pathSegments
      .at(-1)
      ?.replaceAll(/[-_]/g, " ")
      .replace(/^./, (c) => c.toUpperCase()) ?? "Home";

  const { activeWave, headerWavePreview, isWaveResolving, waveId } =
    useHeaderActiveWave(myStream);
  const headerDropAction = getHeaderDropAction({ activeWave, waveDropAction });

  const { viewMode, toggleViewMode } = useWaveViewMode(waveId ?? "");
  const { isRankWave, isApproveWave, isMemesWave, isDm } = useWave(activeWave);
  const directMessageProfileHref = getDirectMessageProfileHref({
    isDirectMessage: isDm,
    identity: activeWave?.name,
    connectedProfile,
    activeProfileProxyCreatedBy: activeProfileProxy?.created_by,
  });
  const showGalleryToggle = Boolean(
    activeWave && !isRankWave && !isApproveWave && !isMemesWave && !isDm
  );
  const showWaveLinkAction = Boolean(activeWave && !isDm);
  const previewText = getWaveDescriptionPreviewText(activeWave);
  const {
    mode: waveLinkActionMode,
    label: waveLinkActionLabel,
    feedbackState: waveLinkActionFeedbackState,
    isSharing: isWaveLinkSharing,
    onClick: handleWaveLinkActionClick,
  } = useWaveShareCopyAction({
    waveId: waveId ?? "",
    waveName: activeWave?.name ?? "",
    isDirectMessage: activeWave ? isDm : false,
    showShareFeedback: !isCapacitor,
  });
  const isWavesRoute = pathname === "/waves" || pathname.startsWith("/waves/");
  const isMessagesRoute =
    pathname === "/messages" || pathname.startsWith("/messages/");
  const isHomeRoute = pathname === "/";

  const isCreateRoute =
    pathname === "/waves/create" || pathname === "/messages/create";
  const isInsideWave = !!waveId;
  const waveParam = getActiveWaveIdFromUrl({ pathname, searchParams });
  const activeView = getActiveViewFromUrl({
    activeWaveId: waveParam,
    searchParams,
  });
  const showPageShareAction = shouldShowHeaderPageShareAction({
    activeView,
    isCapacitor,
    pathname,
  });

  const isProfilePage = typeof params["user"] === "string";

  const showBackButton =
    isInsideWave || isCreateRoute || (isProfilePage && canGoBack);
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
    wave: headerWavePreview,
    isWaveResolving,
    isWavesRoute,
    isMessagesRoute,
    basePath,
    pageTitle,
    pathSegments,
  });
  const appHeaderMoreMenuItems = getAppHeaderMoreMenuItems({
    handleWaveLinkActionClick,
    isWaveLinkSharing,
    showGalleryToggle,
    showWaveLinkAction,
    toggleViewMode,
    viewMode,
    waveLinkActionFeedbackState,
    waveLinkActionLabel,
    waveLinkActionMode,
  });

  return (
    <div className="tw-w-full tw-bg-black tw-pt-[env(safe-area-inset-top,0px)] tw-text-iron-50">
      <div className="tw-flex tw-h-16 tw-items-center tw-justify-between tw-gap-x-2 tw-px-4">
        <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center">
          {showBackButton ? (
            <BackButton />
          ) : (
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
        </div>
        <div
          className={clsx(
            "tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2",
            isInsideWave ? "tw-justify-start" : "tw-justify-center"
          )}
        >
          <HeaderTitleContent
            displayWave={headerWavePreview}
            activeWave={activeWave}
            isDm={isDm}
            directMessageProfileHref={directMessageProfileHref}
            previewText={previewText}
            finalTitle={finalTitle}
          />
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-justify-end tw-gap-x-0.5">
          <HeaderDropActionButton action={headerDropAction} />
          {isHomeRoute && <NetworkHealthCTA className="md:tw-hidden" />}
          <div className="tw-flex-shrink-0">
            <HeaderActionButtons />
          </div>
          {showPageShareAction && (
            <div className="tw-flex-shrink-0">
              <HeaderPageShareButton isCapacitor={isCapacitor} />
            </div>
          )}
          <div className="tw-flex-shrink-0">
            <HeaderSearchButton
              wave={
                isInsideWave && (isWavesRoute || isMessagesRoute)
                  ? activeWave
                  : null
              }
            />
          </div>
          <HeaderMoreMenu items={appHeaderMoreMenuItems} />
        </div>
      </div>
      <AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
