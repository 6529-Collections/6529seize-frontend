import React from "react";
import {
  ChatBubbleLeftIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import type { CompactMenuItem } from "@/components/compact-menu";
import { createBreakpoint } from "react-use";
import { useContentTab } from "@/components/brain/ContentTabContext";
import { getBoostedDropsDisplayPreferenceMenuItems } from "@/components/waves/boosted-drops/BoostedDropsDisplayPreference";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBoostedDropsDisplayPreference } from "@/hooks/useBoostedDropsDisplayPreference";
import type { WaveViewMode } from "@/hooks/useWaveViewMode";
import { MyStreamWaveTab } from "@/types/waves.types";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import type { ChatSubmitDropAction } from "../chatSubmitDrop.types";
import MyStreamWaveTabsHeader, {
  type MyStreamWaveTabsHeaderActionContext,
} from "./MyStreamWaveTabsHeader";

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
  const breakpoint = useBreakpoint();
  const showBackButton = breakpoint !== "LG";
  const isCompact = breakpoint === "S";
  const [boostedDropsDisplayPreference, setBoostedDropsDisplayPreference] =
    useBoostedDropsDisplayPreference();
  const headerActionsTooltipId = `my-stream-wave-header-actions-${wave.id}`;
  const galleryToggleLabel =
    viewMode === "chat" ? "Switch to gallery view" : "Switch to chat view";

  const renderHeaderLeadingActions = ({
    activeContentTab: headerActiveContentTab,
    isCompact: headerIsCompact,
    tooltipId,
  }: MyStreamWaveTabsHeaderActionContext) => {
    const action = chatSubmitDropAction;
    const showChatSubmitDropAction =
      headerActiveContentTab === MyStreamWaveTab.CHAT &&
      !activeCurationId &&
      action?.isVisible === true;
    const chatSubmitDropTooltip = action
      ? (action.restrictionMessage ?? action.label)
      : null;
    const chatSubmitDropTitle = chatSubmitDropTooltip ?? undefined;

    return (
      <>
        {showChatSubmitDropAction && (
          <span
            className="tw-inline-flex"
            title={chatSubmitDropTitle}
            data-tooltip-id={tooltipId}
            data-tooltip-content={chatSubmitDropTooltip}
          >
            <PrimaryButton
              loading={false}
              disabled={!action.canOpen}
              onClicked={action.onOpen}
              padding="tw-p-0 sm:tw-px-2.5 sm:tw-py-2"
              title={chatSubmitDropTitle}
              ariaLabel={action.label}
              className="tw-h-8 tw-w-8 tw-min-w-8 sm:tw-h-auto sm:tw-w-auto sm:tw-min-w-0"
            >
              <PlusIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 sm:-tw-ml-1" />
              <span className="tw-sr-only sm:tw-not-sr-only sm:tw-inline">
                {action.compactLabel}
              </span>
            </PrimaryButton>
          </span>
        )}
        {!headerIsCompact && showGalleryToggle && !activeCurationId && (
          <button
            type="button"
            onClick={onToggleViewMode}
            aria-label={galleryToggleLabel}
            data-tooltip-id={tooltipId}
            data-tooltip-content={galleryToggleLabel}
            className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
          >
            {viewMode === "chat" ? (
              <Squares2X2Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            ) : (
              <ChatBubbleLeftIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            )}
          </button>
        )}
      </>
    );
  };

  const renderHeaderOverflowMenuItems = ({
    isCompact: headerIsCompact,
  }: MyStreamWaveTabsHeaderActionContext): CompactMenuItem[] => {
    if (!headerIsCompact) {
      return [];
    }

    const items: CompactMenuItem[] = [];
    items.push(
      ...getBoostedDropsDisplayPreferenceMenuItems({
        preference: boostedDropsDisplayPreference,
        setPreference: setBoostedDropsDisplayPreference,
      })
    );

    if (showGalleryToggle && !activeCurationId) {
      items.push({
        id: "toggle-view-mode",
        label: galleryToggleLabel,
        icon:
          viewMode === "chat" ? (
            <Squares2X2Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          ) : (
            <ChatBubbleLeftIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          ),
        onSelect: onToggleViewMode,
      });
    }

    return items;
  };

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-bg-iron-950">
      <MyStreamWaveTabsHeader
        wave={wave}
        activeContentTab={activeContentTab}
        setActiveContentTab={setActiveContentTab}
        onSelectCuration={onSelectCuration}
        isCompact={isCompact}
        showBackButton={showBackButton}
        headerActionsTooltipId={headerActionsTooltipId}
        headerClassName="tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-2 tw-py-3 sm:tw-gap-x-4 sm:tw-px-4"
        actionsClassName="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2 tw-self-stretch tw-pl-3 sm:tw-pl-4"
        renderLeadingActions={renderHeaderLeadingActions}
        renderOverflowMenuItems={renderHeaderOverflowMenuItems}
      />
      <div className="tw-border-b tw-border-l-0 tw-border-t-0 tw-border-solid tw-border-iron-800">
        <MyStreamWaveDesktopTabs
          activeTab={activeContentTab}
          wave={wave}
          setActiveTab={setActiveContentTab}
          activeCurationId={activeCurationId}
          onSelectCuration={onSelectCuration}
        />
      </div>
    </div>
  );
};

export default MyStreamWaveTabsDefault;
