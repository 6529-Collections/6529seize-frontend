import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import { useContentTab } from "../../ContentTabContext";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";
import WavePicture from "../../../waves/WavePicture";
interface MyStreamWaveTabsDefaultProps {
  readonly wave: ApiWave;
}

const MyStreamWaveTabsDefault: React.FC<MyStreamWaveTabsDefaultProps> = ({
  wave,
}) => {
  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarState();

  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-gap-y-3 tw-bg-iron-950">
      {/* Wave name header with toggle button */}
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-px-6 tw-py-3">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <div className="tw-size-9 tw-flex-shrink-0 tw-ring-1 tw-ring-offset-1 tw-ring-offset-iron-950 tw-ring-white/30 tw-rounded-full">
            <WavePicture
              name={wave.name}
              picture={wave.picture}
              contributors={wave.contributors_overview.map((c) => ({
                pfp: c.contributor_pfp,
              }))}
            />
          </div>
          <h1 className="tw-text-xl tw-font-semibold tw-text-white/95 tw-tracking-tight tw-mb-0">
            {wave.name}
          </h1>
        </div>
        {/* Right sidebar toggle button */}
        <button
          type="button"
          onClick={toggleRightSidebar}
          className="tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700 tw-transition-all tw-duration-200 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-border-iron-600 tw-shadow-sm tw-flex-shrink-0"
          aria-label="Toggle right sidebar"
        >
          <ChevronDoubleLeftIcon
            strokeWidth={3}
            className={`tw-h-4 tw-w-4 tw-text-iron-300 group-hover:tw-text-iron-200 tw-transition-all tw-duration-200 ${
              isRightSidebarOpen ? "tw-rotate-180" : "tw-rotate-0"
            }`}
          />
        </button>
      </div>
      <MyStreamWaveDesktopTabs
        activeTab={activeContentTab}
        wave={wave}
        setActiveTab={setActiveContentTab}
      />
    </div>
  );
};

export default MyStreamWaveTabsDefault;
