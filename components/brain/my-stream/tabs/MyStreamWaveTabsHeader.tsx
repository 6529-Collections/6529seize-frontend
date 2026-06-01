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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SetActiveContentTab } from "@/components/brain/ContentTabContext";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";
import { MyStreamWaveTab } from "@/types/waves.types";
import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import WaveDescriptionPopover from "@/components/waves/header/WaveDescriptionPopover";
import WavePicture from "../../../waves/WavePicture";
import MyStreamActionTooltip from "../MyStreamActionTooltip";
import { useSidebarState } from "../../../../hooks/useSidebarState";

const TRUNCATION_EPSILON_PX = 1;

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
}: MyStreamWaveTabsHeaderProps) {
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const descriptionPreviewRef = useRef<HTMLSpanElement>(null);
  const [isDescriptionPreviewTruncated, setIsDescriptionPreviewTruncated] =
    useState(false);
  const waveChatScroll = useWaveChatScrollOptional();
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
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
  const renderWaveLinkActionIcon = () => {
    if (waveLinkActionFeedbackState !== "idle") {
      return <CheckIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
    }

    if (waveLinkActionMode === "share") {
      return <ShareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
    }

    return <LinkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
  };

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
      <div className={headerClassName}>
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-3">
          {showBackButton && (
            <button
              type="button"
              onClick={handleMobileBack}
              className="-tw-ml-2.5 tw-mr-1.5 tw-flex tw-h-full tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-px-2.5 tw-text-iron-300 tw-transition-colors hover:tw-text-iron-50"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
            </button>
          )}
          <div className="tw-size-9 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950">
            <WavePicture
              name={wave.name}
              picture={wave.picture}
              contributors={wave.contributors_overview.map((c) => ({
                pfp: c.contributor_pfp,
                identity: c.contributor_identity,
              }))}
            />
          </div>
          {showDescriptionPreview ? (
            <WaveDescriptionPopover
              wave={wave}
              align="left"
              ariaLabel="Show wave description"
              triggerClassName="tw-group tw-flex tw-min-w-0 tw-cursor-pointer tw-flex-col tw-items-start tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
            >
              <h1 className="tw-mb-0 tw-w-full tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
                {wave.name}
              </h1>
              <span className="tw-mt-0.5 tw-flex tw-w-full tw-min-w-0 tw-max-w-xl tw-items-center tw-gap-x-1.5">
                <span
                  ref={descriptionPreviewRef}
                  className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-xs tw-font-normal tw-text-iron-400 tw-transition-colors tw-duration-300 group-hover:tw-text-iron-300"
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
          ) : (
            <h1 className="tw-mb-0 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
              {wave.name}
            </h1>
          )}
        </div>
        <div className={actionsClassName}>
          {renderLeadingActions?.({
            activeContentTab,
            isCompact,
            tooltipId: headerActionsTooltipId,
          })}
          {showShareAction && (
            <button
              type="button"
              onClick={handleWaveLinkActionClick}
              aria-label={waveLinkActionLabel}
              data-tooltip-id={headerActionsTooltipId}
              data-tooltip-content={waveLinkActionLabel}
              data-wave-link-action-mode={waveLinkActionMode}
              className={`tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white ${waveLinkActionIconColor}`}
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
            className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
          >
            <MagnifyingGlassIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          </button>
          <button
            type="button"
            onClick={toggleRightSidebar}
            data-tooltip-id={headerActionsTooltipId}
            data-tooltip-content={rightSidebarActionLabel}
            className={`tw-group tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 ${rightSidebarButtonBackgroundClassName} tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-500/80 desktop-hover:hover:tw-bg-iron-700/85 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)]`}
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
