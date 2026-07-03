"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import type { SetActiveContentTab } from "@/components/brain/ContentTabContext";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { getDirectMessageProfileHref } from "@/helpers/waves/direct-message-profile.helpers";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";
import { MyStreamWaveTab } from "@/types/waves.types";
import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import WaveDescriptionPopover from "@/components/waves/header/WaveDescriptionPopover";
import WavePicture from "../../../waves/WavePicture";
import { WaveTrustSignals } from "@/components/waves/WaveTrustSignals";
import MyStreamActionTooltip from "../MyStreamActionTooltip";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import WaveRepButton from "@/components/waves/header/rep/WaveRepButton";

const TRUNCATION_EPSILON_PX = 1;
const WAVE_SCORE_LEARN_MORE_HREF = "/network/wave-score";

export interface MyStreamWaveTabsHeaderActionContext {
  readonly activeContentTab: MyStreamWaveTab;
  readonly isCompact: boolean;
  readonly tooltipId: string;
}

interface MyStreamWaveTabsHeaderProps {
  readonly wave: ApiWave;
  readonly activeContentTab: MyStreamWaveTab;
  readonly setActiveContentTab: SetActiveContentTab;
  readonly onSelectCuration: (curationId: string | null) => void;
  readonly isCompact: boolean;
  readonly showBackButton: boolean;
  readonly headerActionsTooltipId: string;
  readonly headerClassName: string;
  readonly actionsClassName: string;
  readonly rightSidebarButtonBackgroundClassName?: string | undefined;
  readonly renderLeadingActions?:
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

const getWaveIsDirectMessage = (wave: ApiWave): boolean =>
  wave.chat.scope.group !== null
    ? wave.chat.scope.group.is_direct_message === true
    : false;

const getLowercaseHandle = (
  handle: string | null | undefined
): string | null =>
  handle !== null && handle !== undefined ? handle.toLowerCase() : null;

interface MyStreamWaveHeaderIdentityProps {
  readonly descriptionPreviewRef: React.RefObject<HTMLSpanElement | null>;
  readonly directMessageProfileHref: string | null;
  readonly isCompact: boolean;
  readonly isDescriptionPreviewTruncated: boolean;
  readonly previewText: string | null;
  readonly showDescriptionPreview: boolean;
  readonly wave: ApiWave;
  readonly wavePictureContributors: WavePictureContributors;
  readonly waveScoreLearnMoreHref: string;
  readonly showWaveRepAction: boolean;
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
  descriptionPreviewRef,
  directMessageProfileHref,
  isCompact,
  isDescriptionPreviewTruncated,
  previewText,
  showDescriptionPreview,
  wave,
  wavePictureContributors,
  waveScoreLearnMoreHref,
  showWaveRepAction,
}: MyStreamWaveHeaderIdentityProps) {
  const scoreActions = (
    <span className="-tw-ml-1.5 tw-mt-1 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-1.5">
      <WaveTrustSignals
        waveRep={wave.wave_rep}
        waveScore={wave.wave_score}
        variant="header-inline"
        mode="summary"
        learnMoreHref={waveScoreLearnMoreHref}
      />
      {showWaveRepAction && !isCompact && (
        <WaveRepButton wave={wave} variant="compact" />
      )}
    </span>
  );

  if (directMessageProfileHref) {
    return (
      <Link
        href={directMessageProfileHref}
        aria-label={`View ${wave.name}'s profile`}
        className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-3 tw-text-white/95 tw-no-underline tw-transition-colors desktop-hover:hover:tw-text-white"
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
    <>
      <div className="tw-size-9 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950">
        <WavePicture
          name={wave.name}
          picture={wave.picture}
          contributors={wavePictureContributors}
        />
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
        {showDescriptionPreview ? (
          <>
            <WaveDescriptionPopover
              wave={wave}
              align="left"
              ariaLabel="Show wave description"
              triggerClassName={`tw-group tw-flex tw-min-w-0 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-left ${
                isCompact
                  ? "tw-items-center"
                  : "tw-w-full tw-flex-col tw-items-start"
              }`}
            >
              {isCompact ? (
                <h1 className="tw-m-0 tw-flex tw-min-w-0 tw-items-center tw-gap-x-1.5 tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95">
                  <span className="tw-min-w-0 tw-truncate">{wave.name}</span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-300 tw-transition-colors group-hover:tw-text-white"
                  />
                </h1>
              ) : (
                <>
                  <h1 className="tw-m-0 tw-w-full tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
                    {wave.name}
                  </h1>
                  <span className="tw-mt-0.5 tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-x-1.5">
                    <span
                      ref={descriptionPreviewRef}
                      className="tw-min-w-0 tw-truncate tw-text-xs tw-font-normal tw-text-iron-400 tw-transition-colors tw-duration-300 group-hover:tw-text-iron-300"
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
                </>
              )}
            </WaveDescriptionPopover>
            {!isCompact && (
              <span className="tw-self-start">{scoreActions}</span>
            )}
            {isCompact && scoreActions}
          </>
        ) : (
          <>
            <h1 className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
              {wave.name}
            </h1>
            {scoreActions}
          </>
        )}
      </div>
    </>
  );
}

export default function MyStreamWaveTabsHeader({
  wave,
  activeContentTab,
  setActiveContentTab,
  onSelectCuration,
  isCompact,
  showBackButton,
  headerActionsTooltipId,
  headerClassName,
  actionsClassName,
  rightSidebarButtonBackgroundClassName = "tw-bg-iron-800",
  renderLeadingActions,
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const descriptionPreviewRef = useRef<HTMLSpanElement>(null);
  const [isDescriptionPreviewTruncated, setIsDescriptionPreviewTruncated] =
    useState(false);
  const waveChatScroll = useWaveChatScrollOptional();
  const isDirectMessage = getWaveIsDirectMessage(wave);
  const connectedHandle = getLowercaseHandle(connectedProfile?.handle);
  const waveAuthorHandle = getLowercaseHandle(wave.author.handle);
  const showWaveRepAction =
    connectedHandle !== null &&
    !activeProfileProxy &&
    !isDirectMessage &&
    waveAuthorHandle !== null &&
    connectedHandle !== waveAuthorHandle;
  const directMessageProfileHref = getDirectMessageProfileHref({
    isDirectMessage,
    identity: wave.name,
    connectedProfile,
    activeProfileProxyCreatedBy: activeProfileProxy?.created_by,
  });
  const wavePictureContributors = wave.contributors_overview.map((c) => ({
    pfp: c.contributor_pfp,
    identity: c.contributor_identity,
  }));
  const showShareAction = !isDirectMessage;
  const previewText = getWaveDescriptionPreviewText(wave);
  const showDescriptionPreview = showShareAction && !!previewText;
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

  const handleSearchSelect = (serialNo: number) => {
    onSelectCuration(null);
    setActiveContentTab(MyStreamWaveTab.CHAT);
    if (waveChatScroll) {
      waveChatScroll.requestScrollToSerialNo({ waveId: wave.id, serialNo });
      return;
    }

    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("curation");
    params.set("serialNo", String(serialNo));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const waveLinkActionIconColor =
    waveLinkActionFeedbackState === "idle"
      ? "tw-text-iron-200"
      : "tw-text-emerald-300";
  const searchMessagesLabel = "Search messages in this wave";
  const rightSidebarActionLabel = isRightSidebarOpen
    ? "Hide right sidebar"
    : "Show right sidebar";
  const rightSidebarCompactLabel = isRightSidebarOpen
    ? "Hide details"
    : "Wave details";
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
    tooltipId: headerActionsTooltipId,
  };
  const externalOverflowMenuItems = isCompact
    ? (renderOverflowMenuItems?.(actionContext) ?? [])
    : [];
  const headerOverflowMenuItems: CompactMenuItem[] = isCompact
    ? [
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
        {
          id: "wave-details",
          label: rightSidebarCompactLabel,
          icon: (
            <ChevronDoubleLeftIcon
              strokeWidth={2}
              className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition ${
                isRightSidebarOpen ? "tw-rotate-180" : "tw-rotate-0"
              }`}
            />
          ),
          onSelect: toggleRightSidebar,
        },
      ]
    : [];
  const compactMenuItems = [
    ...externalOverflowMenuItems,
    ...headerOverflowMenuItems,
  ];

  useLayoutEffect(() => {
    if (!showDescriptionPreview || isCompact) {
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
  }, [isCompact, previewText, showDescriptionPreview]);

  return (
    <>
      <div className={headerClassName}>
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-2">
          {showBackButton && (
            <button
              type="button"
              onClick={handleMobileBack}
              className="tw-flex tw-h-full tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-px-1.5 tw-text-iron-300 tw-transition-colors hover:tw-text-iron-50 sm:-tw-ml-2.5 sm:tw-px-2.5"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 sm:tw-h-6 sm:tw-w-6" />
            </button>
          )}
          <MyStreamWaveHeaderIdentity
            descriptionPreviewRef={descriptionPreviewRef}
            directMessageProfileHref={directMessageProfileHref}
            isCompact={isCompact}
            isDescriptionPreviewTruncated={isDescriptionPreviewTruncated}
            previewText={previewText}
            showDescriptionPreview={showDescriptionPreview}
            wave={wave}
            wavePictureContributors={wavePictureContributors}
            waveScoreLearnMoreHref={waveScoreLearnMoreHref}
            showWaveRepAction={showWaveRepAction}
          />
        </div>
        <div className={actionsClassName}>
          {renderLeadingActions?.(actionContext)}
          {showShareAction && !isCompact && (
            <button
              type="button"
              onClick={handleWaveLinkActionClick}
              aria-label={waveLinkActionLabel}
              data-tooltip-id={headerActionsTooltipId}
              data-tooltip-content={waveLinkActionLabel}
              data-wave-link-action-mode={waveLinkActionMode}
              className={`tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white ${waveLinkActionIconColor}`}
            >
              {renderWaveLinkActionIcon()}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label={searchMessagesLabel}
            data-tooltip-id={headerActionsTooltipId}
            data-tooltip-content={searchMessagesLabel}
            className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
          >
            <MagnifyingGlassIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          </button>
          {!isCompact && (
            <button
              type="button"
              onClick={toggleRightSidebar}
              data-tooltip-id={headerActionsTooltipId}
              data-tooltip-content={rightSidebarActionLabel}
              className={`tw-group tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 ${rightSidebarButtonBackgroundClassName} tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-500/80 desktop-hover:hover:tw-bg-iron-700/85 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)]`}
              aria-label={rightSidebarActionLabel}
            >
              <ChevronDoubleLeftIcon
                strokeWidth={2}
                className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 tw-transition tw-duration-300 ${
                  isRightSidebarOpen
                    ? "tw-rotate-180 desktop-hover:group-hover:tw-translate-x-0.5"
                    : "tw-rotate-0 desktop-hover:group-hover:-tw-translate-x-0.5"
                }`}
              />
            </button>
          )}
          {isCompact && compactMenuItems.length > 0 && (
            <CompactMenu
              aria-label="More wave actions"
              unstyledTrigger
              triggerClassName="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
              trigger={
                <>
                  <span className="tw-sr-only">More wave actions</span>
                  <EllipsisHorizontalIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                </>
              }
              items={compactMenuItems}
              menuWidthClassName="tw-w-52"
            />
          )}
        </div>
      </div>
      <MyStreamActionTooltip id={headerActionsTooltipId} />
      <WaveDropsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        wave={wave}
        onSelectSerialNo={handleSearchSelect}
      />
    </>
  );
}
