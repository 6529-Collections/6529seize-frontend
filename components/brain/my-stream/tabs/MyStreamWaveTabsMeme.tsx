"use client";

import React, { useState } from "react";
import type { CompactMenuItem } from "@/components/compact-menu";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useWave, SubmissionStatus } from "@/hooks/useWave";
import { MainStageNominationPopoverContent } from "./MainStageNominationPopover";
import { createBreakpoint } from "react-use";
import { useContentTab } from "@/components/brain/ContentTabContext";
import MemesArtSubmissionModal from "@/components/waves/memes/LazyMemesArtSubmissionModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import MyStreamWaveCreateActionsMenu from "./MyStreamWaveCreateActionsMenu";
import MyStreamWaveTabsHeader, {
  type MyStreamWaveTabsHeaderActionContext,
} from "./MyStreamWaveTabsHeader";
import MyStreamWaveTabsMemeSubmit from "./MyStreamWaveTabsMemeSubmit";

const useBreakpoint = createBreakpoint({ LG: 1024, MD: 768, S: 0 });

interface MyStreamWaveTabsMemeProps {
  readonly wave: ApiWave;
  readonly activeCurationId: string | null;
  readonly onSelectCuration: (curationId: string | null) => void;
}

const MyStreamWaveTabsMeme: React.FC<MyStreamWaveTabsMemeProps> = ({
  wave,
  activeCurationId,
  onSelectCuration,
}) => {
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const [isMemesModalOpen, setIsMemesModalOpen] = useState(false);
  const [isSubmissionHelpOpen, setIsSubmissionHelpOpen] = useState(false);
  const { participation } = useWave(wave);
  const hasSubmissionHelp =
    participation.status === SubmissionStatus.ACTIVE &&
    participation.isEligible === false;
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === "S";
  const showExternalCreateCurationAction = breakpoint === "LG";
  const showBackButton = breakpoint !== "LG";
  const headerActionsTooltipId = `my-stream-wave-meme-header-actions-${wave.id}`;

  const handleMemesSubmit = () => {
    setIsMemesModalOpen(true);
  };

  const renderHeaderTrailingActions = ({
    isCondensed,
    isNarrow,
  }: MyStreamWaveTabsHeaderActionContext) =>
    isNarrow && hasSubmissionHelp ? null : (
      <MyStreamWaveTabsMemeSubmit
        handleMemesSubmit={handleMemesSubmit}
        wave={wave}
        iconOnly={isCondensed}
      />
    );

  const renderHeaderOverflowMenuItems = ({
    isNarrow,
  }: MyStreamWaveTabsHeaderActionContext): CompactMenuItem[] =>
    isNarrow && hasSubmissionHelp
      ? [
          {
            id: "submission-help",
            label: "How to Submit",
            icon: <LockClosedIcon className="tw-size-4" />,
            onSelect: () => setIsSubmissionHelpOpen(true),
            deferUntilClosed: true,
          },
        ]
      : [];

  return (
    <>
      <div className="tw-flex tw-w-full tw-flex-col tw-bg-iron-950">
        <MyStreamWaveTabsHeader
          wave={wave}
          activeContentTab={activeContentTab}
          isCompact={isCompact}
          showBackButton={showBackButton}
          headerActionsTooltipId={headerActionsTooltipId}
          headerClassName="tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-overflow-x-hidden tw-px-2 tw-py-3 md:tw-py-2.5 sm:tw-gap-x-4 sm:tw-px-4"
          actionsClassName="tw-flex tw-flex-shrink-0 tw-self-start tw-items-center tw-gap-x-2 tw-pt-0.5 md:tw-shrink-0"
          renderTrailingActions={renderHeaderTrailingActions}
          renderOverflowMenuItems={renderHeaderOverflowMenuItems}
        />
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06]">
          <div className="tw-min-w-0 tw-flex-1">
            <MyStreamWaveDesktopTabs
              activeTab={activeContentTab}
              wave={wave}
              setActiveTab={setActiveContentTab}
              activeCurationId={activeCurationId}
              onSelectCuration={onSelectCuration}
              showCreateActionsMenu={!showExternalCreateCurationAction}
            />
          </div>
          {showExternalCreateCurationAction && (
            <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-pr-2 sm:tw-pr-4">
              <MyStreamWaveCreateActionsMenu
                wave={wave}
                onCreated={onSelectCuration}
              />
            </div>
          )}
        </div>
      </div>
      <MemesArtSubmissionModal
        isOpen={isMemesModalOpen}
        wave={wave}
        onClose={() => setIsMemesModalOpen(false)}
      />
      {isSubmissionHelpOpen && (
        <MobileWrapperDialog
          isOpen
          onClose={() => setIsSubmissionHelpOpen(false)}
          ariaLabel="Main Stage submission eligibility"
          title="How to Submit"
          headerVariant="minimal"
        >
          <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
            <MainStageNominationPopoverContent className="tw-w-full" />
          </div>
        </MobileWrapperDialog>
      )}
    </>
  );
};

export default MyStreamWaveTabsMeme;
