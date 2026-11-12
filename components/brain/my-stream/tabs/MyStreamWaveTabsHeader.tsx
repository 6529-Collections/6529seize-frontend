"use client";
import { useWaveInformation } from "@/contexts/WaveInformationContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import React, { useLayoutEffect, useRef, useState } from "react";
import { useMeasure } from "react-use";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDownIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import type { CompactMenuItem } from "@/components/compact-menu";
import DisplayTimeZoneSwitch, {
  useDisplayTimeZoneMenuItem,
} from "@/components/display-time-zone/DisplayTimeZoneSwitch";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { AnnouncementWaveIcon } from "@/components/brain/left-sidebar/waves/SidebarIconTile";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { getDirectMessageProfileHref } from "@/helpers/waves/direct-message-profile.helpers";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";
import type { MyStreamWaveTab } from "@/types/waves.types";
import { useOpenMyStreamWaveSearch } from "./MyStreamWaveSearch";
import {
  preloadWaveDropsSearchModal,
  useWaveDropsSearchModalEarlyPreload,
} from "@/components/waves/drops/search/LazyWaveDropsSearchModal";
import WaveDescriptionPopover from "@/components/waves/header/WaveDescriptionPopover";
import WavePicture from "../../../waves/WavePicture";
import { WaveTrustSignals } from "@/components/waves/WaveTrustSignals";
import MyStreamActionTooltip from "../MyStreamActionTooltip";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import WaveParentNavigation from "@/components/waves/header/WaveParentNavigation";
import WaveRepButton from "@/components/waves/header/rep/WaveRepButton";
import WaveJoinCta from "@/components/waves/header/WaveJoinCta";
import { COMPACT_ACTION_TOUCH_TARGET_CLASS } from "@/components/utils/button/compactActionButtonStyles";
import CompactWaveActions from "./CompactWaveActions";
import WaveHeaderDisplayMenu from "./WaveHeaderDisplayMenu";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { BRAIN_RIGHT_SIDEBAR_ID } from "@/components/brain/right-sidebar/BrainRightSidebarTypes";
import { PlaintextDmEncryptionNotice } from "@/components/e2ee/plaintext/PlaintextDmEncryptionNotice";
import {
  WAVE_HEADER_ACTION_CLASSES,
  WAVE_HEADER_ACTION_SURFACE_CLASSES,
} from "@/components/brain/left-sidebar/waves/WaveHeaderActions";

const TRUNCATION_EPSILON_PX = 1;
const CONDENSED_HEADER_WIDTH_PX = 768;
const DESCRIPTION_PREVIEW_MIN_WIDTH_PX = 640;
const WAVE_SCORE_LEARN_MORE_HREF = "/network/wave-score";

export interface MyStreamWaveTabsHeaderActionContext {
  readonly activeContentTab: MyStreamWaveTab;
  readonly isCompact: boolean;
  readonly isCondensed: boolean;
  readonly tooltipId: string;
}

interface MyStreamWaveTabsHeaderProps {
  readonly wave: ApiWave;
  readonly activeContentTab: MyStreamWaveTab;
  readonly isCompact: boolean;
  readonly showBackButton: boolean;
  readonly headerActionsTooltipId: string;
  readonly headerClassName: string;
  readonly actionsClassName: string;
  readonly renderLeadingActions?:
    | ((context: MyStreamWaveTabsHeaderActionContext) => React.ReactNode)
    | undefined;
  readonly renderTrailingActions?:
    | ((context: MyStreamWaveTabsHeaderActionContext) => React.ReactNode)
    | undefined;
  readonly renderOverflowMenuItems?:
    | ((
        context: MyStreamWaveTabsHeaderActionContext
      ) => readonly CompactMenuItem[])
    | undefined;
}

type WavePictureContributors = React.ComponentProps<
  typeof WavePicture
>["contributors"];

type RuntimeSafeWave = Omit<
  ApiWave,
  "author" | "chat" | "contributors_overview"
> & {
  readonly author?: { readonly handle?: string | null } | null;
  readonly chat?: {
    readonly scope?: {
      readonly group?: { readonly is_direct_message?: boolean | null } | null;
    } | null;
  } | null;
  readonly contributors_overview?: ApiWave["contributors_overview"] | null;
};

const getWaveIsDirectMessage = (wave: ApiWave): boolean =>
  (wave as RuntimeSafeWave).chat?.scope?.group?.is_direct_message === true;

const getWavePictureContributors = (wave: ApiWave): WavePictureContributors =>
  ((wave as RuntimeSafeWave).contributors_overview ?? []).map((c) => ({
    pfp: c.contributor_pfp,
    identity: c.contributor_identity,
  }));

interface MyStreamWaveHeaderIdentityProps {
  readonly isRightSidebarOpen: boolean;
  readonly descriptionPreviewRef: React.RefObject<HTMLSpanElement | null>;
  readonly directMessageProfileHref: string | null;
  readonly isCompact: boolean;
  readonly isDescriptionPreviewTruncated: boolean;
  readonly previewText: string | null;
  readonly showDescriptionPreview: boolean;
  readonly wave: ApiWave;
  readonly wavePictureContributors: WavePictureContributors;
  readonly waveScoreLearnMoreHref: string;
  readonly isDirectMessage: boolean;
}

function getWaveScoreLearnMoreHref({
  pathname,
  searchParams,
}: {
  readonly pathname: string;
  readonly searchParams: { toString: () => string };
}): string {
  const currentQuery = searchParams.toString();
  const returnTo = currentQuery ? `${pathname}?${currentQuery}` : pathname;
  const params = new URLSearchParams({ returnTo });
  return `${WAVE_SCORE_LEARN_MORE_HREF}?${params.toString()}`;
}

function MyStreamWaveHeaderIdentity({
  isRightSidebarOpen,
  descriptionPreviewRef,
  directMessageProfileHref,
  isCompact,
  isDescriptionPreviewTruncated,
  previewText,
  showDescriptionPreview,
  wave,
  wavePictureContributors,
  waveScoreLearnMoreHref,
  isDirectMessage,
}: MyStreamWaveHeaderIdentityProps) {
  const seizeSettings = useSeizeSettingsOptional();
  const information = useWaveInformation();
  const locale = useBrowserLocale();
  const isAnnouncement = seizeSettings?.isAnnouncementsWave(wave.id) ?? false;
  const identityOffset = wave.parent_wave ? "md:-tw-mt-2" : "md:-tw-mt-1.5";
  const score = !isDirectMessage ? (
    <WaveTrustSignals
      waveRep={wave.wave_rep}
      waveScore={wave.wave_score}
      variant="header-inline"
      mode="summary"
      learnMoreHref={waveScoreLearnMoreHref}
      className="tw-shrink-0"
    />
  ) : null;

  if (directMessageProfileHref) {
    return (
      <Link
        href={directMessageProfileHref}
        aria-label={`View ${wave.name}'s profile`}
        className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-[13px] tw-text-white/95 tw-no-underline tw-transition-colors desktop-hover:hover:tw-text-white"
      >
        <div className="tw-size-9 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950">
          <WavePicture
            name={wave.name}
            picture={wave.picture}
            contributors={wavePictureContributors}
          />
        </div>
        <h1 className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight lg:tw-text-xl">
          {wave.name}
        </h1>
      </Link>
    );
  }

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-2 md:tw-gap-x-[13px]">
      <div
        className={`tw-size-8 tw-flex-shrink-0 md:tw-size-9 ${showDescriptionPreview || wave.parent_wave ? "tw-self-start" : ""} ${
          isAnnouncement
            ? "tw-rounded-lg"
            : "tw-rounded-full tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950"
        }`}
      >
        {isAnnouncement ? (
          <AnnouncementWaveIcon className="tw-size-5" />
        ) : (
          <WavePicture
            name={wave.name}
            picture={wave.picture}
            contributors={wavePictureContributors}
          />
        )}
      </div>
      {/* Offset the first line's leading to align its text with the avatar. */}
      <div
        className={`tw-flex tw-min-w-0 tw-flex-1 tw-flex-col ${
          showDescriptionPreview ? `md:tw-self-start ${identityOffset}` : ""
        }`}
      >
        <WaveParentNavigation
          parentWave={wave.parent_wave}
          variant={isCompact ? "compact-header" : "header"}
        />
        <div className="tw-flex tw-min-h-6 tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1.5">
          <h1 className="tw-m-0 tw-min-w-0 tw-max-w-full tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
            <button
              type="button"
              onClick={() => {
                if (isCompact) information?.open(wave.id);
                else information?.open(wave.id, false);
              }}
              aria-haspopup={isCompact ? "dialog" : undefined}
              aria-expanded={isCompact ? undefined : isRightSidebarOpen}
              aria-controls={
                !isCompact && isRightSidebarOpen
                  ? BRAIN_RIGHT_SIDEBAR_ID
                  : undefined
              }
              aria-label={t(locale, "waves.information.open", {
                name: wave.name,
              })}
              className="tw-block tw-min-h-6 tw-max-w-full tw-truncate tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-sm tw-font-normal tw-leading-6 tw-text-inherit focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {wave.name}
            </button>
          </h1>
          {score}
        </div>
        {showDescriptionPreview && (
          <WaveDescriptionPopover
            wave={wave}
            align="left"
            ariaLabel="Show wave description"
            triggerClassName="tw-group tw-flex tw-min-h-6 tw-min-w-0 tw-max-w-full tw-cursor-pointer tw-items-center tw-self-start tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 md:tw-max-w-[min(100%,20rem)]"
          >
            <span className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-x-1.5">
              <span
                ref={descriptionPreviewRef}
                className="tw-min-w-0 tw-truncate tw-text-xs tw-font-normal tw-text-iron-400 tw-transition-colors group-hover:tw-text-iron-300"
              >
                {previewText}
              </span>
              {isDescriptionPreviewTruncated && (
                <ChevronDownIcon
                  aria-hidden="true"
                  className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-300 tw-transition-colors group-hover:tw-text-white"
                />
              )}
            </span>
          </WaveDescriptionPopover>
        )}
      </div>
    </div>
  );
}

export default function MyStreamWaveTabsHeader({
  wave,
  activeContentTab,
  isCompact,
  showBackButton,
  headerActionsTooltipId,
  headerClassName,
  actionsClassName,
  renderLeadingActions,
  renderTrailingActions,
  renderOverflowMenuItems,
}: MyStreamWaveTabsHeaderProps) {
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const waveScoreLearnMoreHref = getWaveScoreLearnMoreHref({
    pathname,
    searchParams,
  });
  const { isApp } = useDeviceInfo();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { open: openSearch, trigger: searchTrigger } =
    useOpenMyStreamWaveSearch();
  const displayTimeZoneMenuItem = useDisplayTimeZoneMenuItem();

  // Warm the wave search modal from the visitor's first interaction (or when
  // idle), so the first open does not wait on the network. The chunk stays out
  // of first-load JS.
  useWaveDropsSearchModalEarlyPreload();
  const descriptionPreviewRef = useRef<HTMLSpanElement>(null);
  const [isDescriptionPreviewTruncated, setIsDescriptionPreviewTruncated] =
    useState(false);
  const isDirectMessage = getWaveIsDirectMessage(wave);
  const isCompactWave = isCompact && !isDirectMessage;
  const [headerRef, { width: headerWidth }] = useMeasure<HTMLElement>();
  const isCondensed =
    !isCompact &&
    !isDirectMessage &&
    headerWidth > 0 &&
    headerWidth < CONDENSED_HEADER_WIDTH_PX;
  // Reserve the description row's space even when it is empty, matching the
  // pending header so metadata cannot move the divider and chat tabs.
  const headerMinHeight = wave.parent_wave
    ? "md:tw-min-h-[91px]"
    : "md:tw-min-h-[69px]";
  const connectedHandle = connectedProfile?.handle?.toLowerCase() ?? null;
  const waveAuthorHandle =
    (wave as RuntimeSafeWave).author?.handle?.toLowerCase() ?? null;
  const showWaveRepAction =
    !isCompact &&
    !isDirectMessage &&
    !activeProfileProxy &&
    connectedHandle !== null &&
    waveAuthorHandle !== null &&
    connectedHandle !== waveAuthorHandle;
  const directMessageProfileHref = getDirectMessageProfileHref({
    isDirectMessage,
    identity: wave.name,
    connectedProfile,
    activeProfileProxyCreatedBy: activeProfileProxy?.created_by,
  });
  const wavePictureContributors = getWavePictureContributors(wave);
  const showShareAction = !isDirectMessage;
  const previewText = getWaveDescriptionPreviewText(wave);
  const showDescriptionPreview =
    showShareAction &&
    !!previewText &&
    !isCompact &&
    (headerWidth === 0 || headerWidth >= DESCRIPTION_PREVIEW_MIN_WIDTH_PX);
  const {
    mode: waveLinkActionMode,
    label: waveLinkActionLabel,
    feedbackState: waveLinkActionFeedbackState,
    onClick: handleWaveLinkActionClick,
  } = useWaveShareCopyAction({
    waveId: wave.id,
    waveName: wave.name,
    isDirectMessage,
  });

  const handleMobileBack = () => {
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("wave");
    params.delete("serialNo");
    params.delete("divider");
    params.delete("drop");
    params.delete("curation");
    const basePath = getWaveHomeRoute({
      isDirectMessage,
      isApp,
    });
    const newUrl = params.toString()
      ? `${basePath}?${params.toString()}`
      : basePath;
    router.push(newUrl, { scroll: false });
  };

  const searchMessagesLabel = "Search messages in this wave";
  const rightSidebarActionLabel = isRightSidebarOpen
    ? waveRightPanelText("waves.sidebar.rightPanel.controls.hide")
    : waveRightPanelText("waves.sidebar.rightPanel.controls.show");
  const rightSidebarCompactLabel = isRightSidebarOpen
    ? waveRightPanelText("waves.sidebar.rightPanel.controls.hideDetails")
    : waveRightPanelText("waves.sidebar.rightPanel.controls.openDetails");
  const renderWaveLinkActionIcon = () => {
    if (waveLinkActionFeedbackState !== "idle") {
      return <CheckIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
    }

    if (waveLinkActionMode === "share") {
      return <ShareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
    }

    return <LinkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
  };
  const actionContext: MyStreamWaveTabsHeaderActionContext = {
    activeContentTab,
    isCompact,
    isCondensed,
    tooltipId: headerActionsTooltipId,
  };
  const externalOverflowMenuItems =
    isCompact || !isDirectMessage
      ? (renderOverflowMenuItems?.(actionContext) ?? [])
      : [];
  const headerOverflowMenuItems: CompactMenuItem[] = isCompact
    ? [
        ...(isCompactWave
          ? [
              {
                id: "search-wave",
                label: searchMessagesLabel,
                icon: <MagnifyingGlassIcon className="tw-size-4" />,
                onSelect: openSearch,
                deferUntilClosed: true,
              },
            ]
          : []),
        displayTimeZoneMenuItem,
        ...(showShareAction
          ? [
              {
                id: "wave-link",
                label: waveLinkActionLabel,
                icon: renderWaveLinkActionIcon(),
                onSelect: handleWaveLinkActionClick,
              },
            ]
          : []),
      ]
    : [];
  const compactMenuItems = [
    ...externalOverflowMenuItems,
    ...headerOverflowMenuItems,
  ];
  const backButtonSizeClass = isCompactWave
    ? `tw-size-8 ${COMPACT_ACTION_TOUCH_TARGET_CLASS}`
    : "tw-size-11 tw-self-start sm:-tw-ml-2.5 sm:desktop-hover:tw-h-9";
  const directTimeZoneVariant = isCompact ? "compact" : "header";

  useLayoutEffect(() => {
    if (!showDescriptionPreview) {
      const frameId = globalThis.requestAnimationFrame(() => {
        setIsDescriptionPreviewTruncated(false);
      });

      return () => {
        globalThis.cancelAnimationFrame(frameId);
      };
    }

    const previewElement = descriptionPreviewRef.current;
    if (!previewElement) {
      return;
    }

    const updateTruncationState = () => {
      setIsDescriptionPreviewTruncated(
        previewElement.scrollWidth >
          previewElement.clientWidth + TRUNCATION_EPSILON_PX
      );
    };

    const frameId = globalThis.requestAnimationFrame(updateTruncationState);

    if (typeof ResizeObserver === "undefined") {
      globalThis.addEventListener("resize", updateTruncationState);
      return () => {
        globalThis.cancelAnimationFrame(frameId);
        globalThis.removeEventListener("resize", updateTruncationState);
      };
    }

    const observer = new ResizeObserver(updateTruncationState);
    observer.observe(previewElement);
    if (previewElement.parentElement) {
      observer.observe(previewElement.parentElement);
    }

    return () => {
      globalThis.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [previewText, showDescriptionPreview]);

  return (
    <>
      <header
        ref={headerRef}
        className={`${headerClassName} tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 ${isDirectMessage ? "" : headerMinHeight} ${isCompactWave ? "tw-flex-wrap tw-gap-y-2 tw-@container/wave-header" : ""}`}
      >
        <div
          className={`tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-2 ${isCondensed || isCompactWave ? "tw-self-center" : "tw-self-start tw-pt-0.5"} ${isCompactWave ? "tw-basis-full @[24rem]/wave-header:tw-basis-0" : ""}`}
        >
          {showBackButton && (
            <button
              type="button"
              onClick={handleMobileBack}
              className={`tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-colors hover:tw-text-iron-50 ${backButtonSizeClass}`}
              aria-label="Go back"
            >
              <ArrowLeftIcon
                aria-hidden="true"
                className="tw-size-4 tw-flex-shrink-0"
              />
            </button>
          )}
          <MyStreamWaveHeaderIdentity
            isRightSidebarOpen={isRightSidebarOpen}
            descriptionPreviewRef={descriptionPreviewRef}
            directMessageProfileHref={directMessageProfileHref}
            isCompact={isCompact}
            isDescriptionPreviewTruncated={isDescriptionPreviewTruncated}
            previewText={previewText}
            showDescriptionPreview={showDescriptionPreview}
            wave={wave}
            wavePictureContributors={wavePictureContributors}
            waveScoreLearnMoreHref={waveScoreLearnMoreHref}
            isDirectMessage={isDirectMessage}
          />
          {/* Plaintext DMs (D109): quiet label + start an encrypted chat.
              Renders nothing for other waves or with the flag off. */}
          <PlaintextDmEncryptionNotice wave={wave} compact={isCompact} />
        </div>
        <div
          className={`${
            isCondensed || isCompactWave
              ? "tw-flex tw-shrink-0 tw-items-center tw-gap-x-2 touch-only:tw-gap-x-3"
              : actionsClassName
          } ${isCompactWave ? "tw-ml-auto" : ""}`}
        >
          <WaveJoinCta
            wave={wave}
            tooltipId={headerActionsTooltipId}
            compact={isCompactWave}
          />
          {showWaveRepAction && <WaveRepButton wave={wave} variant="compact" />}
          {renderLeadingActions?.(actionContext)}
          {renderTrailingActions?.(actionContext)}
          {isCompact && compactMenuItems.length > 0 && (
            <CompactWaveActions
              items={compactMenuItems}
              triggerRef={isCompactWave ? searchTrigger : undefined}
            />
          )}
          {!isCompactWave && (
            <>
              <button
                type="button"
                ref={searchTrigger}
                onClick={openSearch}
                onPointerEnter={preloadWaveDropsSearchModal}
                onFocus={preloadWaveDropsSearchModal}
                aria-label={searchMessagesLabel}
                data-tooltip-id={headerActionsTooltipId}
                data-tooltip-content={searchMessagesLabel}
                className={WAVE_HEADER_ACTION_CLASSES}
              >
                <span className={WAVE_HEADER_ACTION_SURFACE_CLASSES}>
                  <MagnifyingGlassIcon className="tw-size-4 tw-flex-shrink-0" />
                </span>
              </button>
              {!isCompact && !isDirectMessage && (
                <WaveHeaderDisplayMenu
                  items={externalOverflowMenuItems}
                  tooltipId={headerActionsTooltipId}
                />
              )}
              <DisplayTimeZoneSwitch
                variant={isDirectMessage ? directTimeZoneVariant : "indicator"}
                tooltipId={headerActionsTooltipId}
              />
            </>
          )}
          <button
            type="button"
            onClick={toggleRightSidebar}
            data-tooltip-id={headerActionsTooltipId}
            data-tooltip-content={
              isCompact ? rightSidebarCompactLabel : rightSidebarActionLabel
            }
            className={WAVE_HEADER_ACTION_CLASSES}
            aria-label={
              isCompact ? rightSidebarCompactLabel : rightSidebarActionLabel
            }
            aria-controls={
              isRightSidebarOpen ? BRAIN_RIGHT_SIDEBAR_ID : undefined
            }
            aria-expanded={isRightSidebarOpen}
            aria-pressed={isRightSidebarOpen}
          >
            <span className={WAVE_HEADER_ACTION_SURFACE_CLASSES}>
              <ChevronDoubleLeftIcon
                strokeWidth={2}
                aria-hidden="true"
                className={`tw-size-4 tw-flex-shrink-0 tw-transition tw-duration-300 ${
                  isRightSidebarOpen
                    ? "tw-rotate-180 desktop-hover:group-hover:tw-translate-x-0.5"
                    : "tw-rotate-0 desktop-hover:group-hover:-tw-translate-x-0.5"
                }`}
              />
            </span>
          </button>
        </div>
      </header>
      <MyStreamActionTooltip
        id={headerActionsTooltipId}
        variant="wave-header"
      />
    </>
  );
}
