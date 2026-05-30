import React, { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import { useContentTab } from "@/components/brain/ContentTabContext";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import {
  ChevronDoubleLeftIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  Squares2X2Icon,
  ShareIcon,
  LinkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import WavePicture from "../../../waves/WavePicture";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createBreakpoint } from "react-use";
import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import { MyStreamWaveTab } from "@/types/waves.types";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { WaveViewMode } from "@/hooks/useWaveViewMode";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";
import WaveDescriptionPopover from "@/components/waves/header/WaveDescriptionPopover";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import MyStreamActionTooltip from "../MyStreamActionTooltip";
import type { ChatSubmitDropAction } from "../chatSubmitDrop.types";
import SeekingNominationInfoPopover from "./SeekingNominationInfoPopover";
import { MEMES_SEEKING_NOMINATION_WAVE_ID } from "./memesNomination.constants";

const useBreakpoint = createBreakpoint({ LG: 1024, MD: 768, S: 0 });
interface MyStreamWaveTabsDefaultProps {
  readonly wave: ApiWave;
  readonly viewMode: WaveViewMode;
  readonly onToggleViewMode: () => void;
  readonly showGalleryToggle: boolean;
  readonly activeCurationId?: string | null | undefined;
  readonly onSelectCuration?: ((curationId: string | null) => void) | undefined;
  readonly chatSubmitDropAction?: ChatSubmitDropAction | null | undefined;
}

const MyStreamWaveTabsDefault: React.FC<MyStreamWaveTabsDefaultProps> = ({
  wave,
  viewMode,
  onToggleViewMode,
  showGalleryToggle,
  activeCurationId = null,
  onSelectCuration = () => {},
  chatSubmitDropAction = null,
}) => {
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarState();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const breakpoint = useBreakpoint();
  const showBackButton = breakpoint !== "LG";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const waveChatScroll = useWaveChatScrollOptional();
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
  const showShareAction = !isDirectMessage;
  const previewText = getWaveDescriptionPreviewText(wave);
  const showDescriptionPreview = showShareAction && !!previewText;
  const isSeekingNominationWave =
    wave.id.trim().toLowerCase() === MEMES_SEEKING_NOMINATION_WAVE_ID;
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
      isDirectMessage: wave.chat.scope.group?.is_direct_message ?? false,
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
  const headerActionsTooltipId = `my-stream-wave-header-actions-${wave.id}`;
  const galleryToggleLabel =
    viewMode === "chat" ? "Switch to gallery view" : "Switch to chat view";
  const searchMessagesLabel = "Search messages in this wave";
  const rightSidebarActionLabel = isRightSidebarOpen
    ? "Hide right sidebar"
    : "Show right sidebar";
  const showChatSubmitDropAction =
    activeContentTab === MyStreamWaveTab.CHAT &&
    !activeCurationId &&
    chatSubmitDropAction?.isVisible === true;
  const chatSubmitDropTooltip = chatSubmitDropAction
    ? (chatSubmitDropAction.restrictionMessage ?? chatSubmitDropAction.label)
    : null;
  const chatSubmitDropTitle = chatSubmitDropTooltip ?? undefined;
  const chatSubmitDropAriaLabel = chatSubmitDropAction
    ? chatSubmitDropAction.label
    : undefined;
  const renderWaveLinkActionIcon = () => {
    if (waveLinkActionFeedbackState !== "idle") {
      return <CheckIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
    }

    if (waveLinkActionMode === "share") {
      return <ShareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
    }

    return <LinkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />;
  };

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-bg-iron-950">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-2 tw-py-3 sm:tw-px-4">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-3">
          {showBackButton && (
            <button
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
              triggerClassName="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
            >
              <h1 className="tw-mb-0 tw-w-full tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
                {wave.name}
              </h1>
              <span className="tw-mt-0.5 tw-block tw-w-full tw-truncate tw-text-xs tw-font-normal tw-text-iron-400">
                {previewText}
              </span>
            </WaveDescriptionPopover>
          ) : (
            <h1 className="tw-mb-0 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
              {wave.name}
            </h1>
          )}
          {isSeekingNominationWave && (
            <div className="tw-hidden tw-flex-shrink-0 md:tw-flex">
              <SeekingNominationInfoPopover />
            </div>
          )}
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2 tw-self-stretch">
          {showChatSubmitDropAction && (
            <span
              className="tw-inline-flex"
              title={chatSubmitDropTitle}
              data-tooltip-id={headerActionsTooltipId}
              data-tooltip-content={chatSubmitDropTooltip}
            >
              <PrimaryButton
                loading={false}
                disabled={!chatSubmitDropAction.canOpen}
                onClicked={chatSubmitDropAction.onOpen}
                padding="tw-px-2.5 tw-py-2"
                title={chatSubmitDropTitle}
                ariaLabel={chatSubmitDropAriaLabel}
              >
                <PlusIcon className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0" />
                <span>{chatSubmitDropAction.compactLabel}</span>
              </PrimaryButton>
            </span>
          )}
          {showGalleryToggle && !activeCurationId && (
            <button
              type="button"
              onClick={onToggleViewMode}
              aria-label={galleryToggleLabel}
              data-tooltip-id={headerActionsTooltipId}
              data-tooltip-content={galleryToggleLabel}
              className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
            >
              {viewMode === "chat" ? (
                <Squares2X2Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
              ) : (
                <ChatBubbleLeftIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
              )}
            </button>
          )}
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
            className="tw-group tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-500/80 desktop-hover:hover:tw-bg-iron-700/85 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)]"
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
      <div className="tw-border-b tw-border-l-0 tw-border-t-0 tw-border-solid tw-border-iron-800">
        <MyStreamWaveDesktopTabs
          activeTab={activeContentTab}
          wave={wave}
          setActiveTab={setActiveContentTab}
          activeCurationId={activeCurationId}
          onSelectCuration={onSelectCuration}
        />
      </div>
      <WaveDropsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        wave={wave}
        onSelectSerialNo={handleSearchSelect}
      />
    </div>
  );
};

export default MyStreamWaveTabsDefault;
