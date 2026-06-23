"use client";

import React, { useState } from "react";
import { createBreakpoint } from "react-use";
import { useContentTab } from "@/components/brain/ContentTabContext";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import MyStreamWaveCreateActionsMenu from "./MyStreamWaveCreateActionsMenu";
import MyStreamWaveTabsHeader from "./MyStreamWaveTabsHeader";
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
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === "S";
  const showExternalCreateCurationAction = breakpoint === "LG";
  const showBackButton = breakpoint !== "LG";
  const headerActionsTooltipId = `my-stream-wave-meme-header-actions-${wave.id}`;

  const handleMemesSubmit = () => {
    setIsMemesModalOpen(true);
  };

  const renderHeaderLeadingActions = () => (
    <MyStreamWaveTabsMemeSubmit
      handleMemesSubmit={handleMemesSubmit}
      wave={wave}
    />
  );

  return (
    <>
      <div className="tw-flex tw-w-full tw-flex-col tw-bg-iron-950">
        <MyStreamWaveTabsHeader
          wave={wave}
          activeContentTab={activeContentTab}
          setActiveContentTab={setActiveContentTab}
          onSelectCuration={onSelectCuration}
          isCompact={isCompact}
          showBackButton={showBackButton}
          headerActionsTooltipId={headerActionsTooltipId}
          headerClassName="tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-overflow-x-hidden tw-px-2 tw-py-3 sm:tw-gap-x-4 sm:tw-px-4 md:tw-gap-x-8"
          actionsClassName="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2 tw-pl-3 sm:tw-pl-4 md:tw-shrink-0"
          rightSidebarButtonBackgroundClassName="tw-bg-iron-700"
          renderLeadingActions={renderHeaderLeadingActions}
        />
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800">
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
    </>
  );
};

export default MyStreamWaveTabsMeme;
