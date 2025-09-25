import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import { useContentTab } from "../../ContentTabContext";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import {
  ChevronDoubleLeftIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import WavePicture from "../../../waves/WavePicture";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createBreakpoint } from "react-use";

// Breakpoint for mobile responsiveness (lg = 1024px)
const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });
interface MyStreamWaveTabsDefaultProps {
  readonly wave: ApiWave;
}

const MyStreamWaveTabsDefault: React.FC<MyStreamWaveTabsDefaultProps> = ({
  wave,
}) => {
  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarState();

  // Navigation hooks for mobile back button
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "S";

  // Mobile back button handler - removes wave param to go back to list
  const handleMobileBack = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("wave");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || "/waves";
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-bg-iron-950">
      {/* Wave name header with toggle button */}
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-py-3 tw-border-b tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-t-0">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          {/* Mobile back button */}
          {isMobile && (
            <button
              onClick={handleMobileBack}
              className="tw-flex tw-items-center tw-bg-transparent tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-transition-colors tw-p-0"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="tw-w-5 tw-h-5 tw-flex-shrink-0" />
            </button>
          )}
          <div className="tw-size-6 lg:tw-size-9 tw-flex-shrink-0 tw-ring-1 tw-ring-offset-1 tw-ring-offset-iron-950 tw-ring-white/30 tw-rounded-full">
            <WavePicture
              name={wave.name}
              picture={wave.picture}
              contributors={wave.contributors_overview.map((c) => ({
                pfp: c.contributor_pfp,
              }))}
            />
          </div>
          <h1 className="tw-text-sm lg:tw-text-xl tw-font-semibold tw-text-white/95 tw-tracking-tight tw-mb-0 tw-truncate">
            {wave.name}
          </h1>
        </div>
        {/* Right sidebar toggle button */}
        <button
          type="button"
          onClick={toggleRightSidebar}
          className="tw-group tw-size-8 tw-rounded-lg tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-bg-iron-700 tw-border tw-border-iron-700 tw-border-solid tw-backdrop-blur-sm tw-transition-all tw-duration-200 tw-shadow-[0_10px_24px_rgba(0,0,0,0.45)] desktop-hover:hover:tw-bg-iron-650 desktop-hover:hover:tw-border-iron-650 desktop-hover:hover:tw-shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
          aria-label="Toggle right sidebar"
        >
          <ChevronDoubleLeftIcon
            strokeWidth={2}
            className={`tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-200 group-hover:hover:tw-text-white tw-transition-all tw-duration-200   ${
              isRightSidebarOpen ? "tw-rotate-180" : "tw-rotate-0"
            }`}
          />
        </button>
      </div>
      <div className="tw-border-b tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-t-0">
        <MyStreamWaveDesktopTabs
          activeTab={activeContentTab}
          wave={wave}
          setActiveTab={setActiveContentTab}
        />
      </div>
    </div>
  );
};

export default MyStreamWaveTabsDefault;
