"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
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
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { AnnouncementWaveIcon } from "@/components/brain/left-sidebar/waves/SidebarIconTile";
import type { SetActiveContentTab } from "@/components/brain/ContentTabContext";
import HeaderSearchModal from "@/components/header/header-search/HeaderSearchModal";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
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
import WaveParentNavigation from "@/components/waves/header/WaveParentNavigation";
import WaveRepButton from "@/components/waves/header/rep/WaveRepButton";
import CompactWaveActions from "./CompactWaveActions";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { BRAIN_RIGHT_SIDEBAR_ID } from "@/components/brain/right-sidebar/BrainRightSidebarTypes";

const TRUNCATION_EPSILON_PX = 1;
const WAVE_SCORE_LEARN_MORE_HREF = "/network/wave-score";
type OpenSearch = "site" | "wave" | null;

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
  const isAnnouncement = seizeSettings?.isAnnouncementsWave(wave.id) ?? false;
  const score =
    !isCompact && !isDirectMessage ? (
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
    <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-[13px]">
      <div
        className={`tw-size-9 tw-flex-shrink-0 tw-self-start ${
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
        className={`tw-flex tw-min-w-0 tw-flex-1 tw-flex-col md:tw-self-start ${
          wave.parent_wave ? "md:-tw-mt-2" : "md:-tw-mt-1.5"
        }`}
      >
        <WaveParentNavigation
          parentWave={wave.parent_wave}
          variant={isCompact ? "compact-header" : "header"}
        />
        {!isCompact && (
          <div className="tw-flex tw-min-h-6 tw-min-w-0 tw-items-center tw-gap-x-1.5 lg:tw-min-h-7">
            <h1 className="tw-m-0 tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
              {wave.name}
            </h1>
            {score}
          </div>
        )}
        {showDescriptionPreview ? (
          <WaveDescriptionPopover
            wave={wave}
            align="left"
            ariaLabel="Show wave description"
            triggerClassName="tw-group tw-flex tw-min-h-6 tw-min-w-0 tw-max-w-full tw-cursor-pointer tw-items-center tw-self-start tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 md:tw-max-w-[min(100%,20rem)]"
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
            )}
          </WaveDescriptionPopover>
        ) : (
          isCompact && (
            <h1 className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95">
              {wave.name}
            </h1>
          )
        )}
      </div>
    </div>
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
  const [openSearch, setOpenSearch] = useState<OpenSearch>(null);
  const descriptionPreviewRef = useRef<HTMLSpanElement>(null);
  const [isDescriptionPreviewTruncated, setIsDescriptionPreviewTruncated] =
    useState(false);
  const waveChatScroll = useWaveChatScrollOptional();
  const isDirectMessage = getWaveIsDirectMessage(wave);
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
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-2 tw-self-start tw-pt-0.5">
          {showBackButton && (
            <button
              type="button"
              onClick={handleMobileBack}
              className="tw-flex tw-h-9 tw-items-center tw-self-start tw-border-0 tw-bg-transparent tw-p-0 tw-px-1.5 tw-text-iron-300 tw-transition-colors hover:tw-text-iron-50 sm:-tw-ml-2.5 sm:tw-px-2.5"
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
            isDirectMessage={isDirectMessage}
          />
        </div>
        <div className={actionsClassName}>
          {renderLeadingActions?.(actionContext)}
          {showWaveRepAction && <WaveRepButton wave={wave} variant="compact" />}
          {renderTrailingActions?.(actionContext)}
          {isCompact && compactMenuItems.length > 0 && (
            <CompactWaveActions items={compactMenuItems} />
          )}
          <button
            type="button"
            onClick={() => setOpenSearch("wave")}
            aria-label={searchMessagesLabel}
            data-tooltip-id={headerActionsTooltipId}
            data-tooltip-content={searchMessagesLabel}
            className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.05] tw-text-iron-200 tw-transition-colors tw-duration-150 hover:tw-border-white/10 hover:tw-bg-white/[0.08] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <MagnifyingGlassIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          </button>
          <button
            type="button"
            onClick={toggleRightSidebar}
            data-tooltip-id={headerActionsTooltipId}
            data-tooltip-content={
              isCompact ? rightSidebarCompactLabel : rightSidebarActionLabel
            }
            className="tw-group tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.05] tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-white/[0.08]"
            aria-label={
              isCompact ? rightSidebarCompactLabel : rightSidebarActionLabel
            }
            aria-controls={
              isRightSidebarOpen ? BRAIN_RIGHT_SIDEBAR_ID : undefined
            }
            aria-expanded={isRightSidebarOpen}
            aria-pressed={isRightSidebarOpen}
          >
            <ChevronDoubleLeftIcon
              strokeWidth={2}
              aria-hidden="true"
              className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 tw-transition tw-duration-300 ${
                isRightSidebarOpen
                  ? "tw-rotate-180 desktop-hover:group-hover:tw-translate-x-0.5"
                  : "tw-rotate-0 desktop-hover:group-hover:-tw-translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
      <MyStreamActionTooltip id={headerActionsTooltipId} />
      <WaveDropsSearchModal
        isOpen={openSearch === "wave"}
        onClose={() => setOpenSearch(null)}
        wave={wave}
        onSelectSerialNo={handleSearchSelect}
        onSearchAll={() => setOpenSearch("site")}
      />
      {openSearch === "site" && (
        <HeaderSearchModal onClose={() => setOpenSearch(null)} wave={null} />
      )}
    </>
  );
}
