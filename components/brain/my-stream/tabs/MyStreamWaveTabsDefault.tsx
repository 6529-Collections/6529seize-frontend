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
} from "@heroicons/react/24/outline";
import WavePicture from "../../../waves/WavePicture";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createBreakpoint } from "react-use";
import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import { MyStreamWaveTab } from "@/types/waves.types";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { WaveViewMode } from "@/hooks/useWaveViewMode";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });
interface MyStreamWaveTabsDefaultProps {
  readonly wave: ApiWave;
  readonly viewMode: WaveViewMode;
  readonly onToggleViewMode: () => void;
  readonly showGalleryToggle: boolean;
}

const MyStreamWaveTabsDefault: React.FC<MyStreamWaveTabsDefaultProps> = ({
  wave,
  viewMode,
  onToggleViewMode,
  showGalleryToggle,
}) => {
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarState();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "S";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const waveChatScroll = useWaveChatScrollOptional();

  const handleMobileBack = () => {
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("wave");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || "/waves";
    router.push(newUrl, { scroll: false });
  };

  const handleSearchSelect = (serialNo: number) => {
    setActiveContentTab(MyStreamWaveTab.CHAT);
    if (waveChatScroll) {
      waveChatScroll.requestScrollToSerialNo({ waveId: wave.id, serialNo });
      return;
    }

    const params = new URLSearchParams(searchParams.toString() || "");
    params.set("serialNo", String(serialNo));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-bg-iron-950">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-2 tw-py-3 sm:tw-px-4">
        <div className="tw-flex tw-min-w-0 tw-items-center">
          {isMobile && (
            <button
              onClick={handleMobileBack}
              className="-tw-ml-2.5 tw-mr-1.5 tw-flex tw-h-full tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-px-2.5 tw-text-iron-300 tw-transition-colors hover:tw-text-iron-50"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
            </button>
          )}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search messages in this wave"
              className="tw-flex tw-min-w-0 tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
            >
              <div className="tw-size-6 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950 lg:tw-size-9">
                <WavePicture
                  name={wave.name}
                  picture={wave.picture}
                  contributors={wave.contributors_overview.map((c) => ({
                    pfp: c.contributor_pfp,
                  }))}
                />
              </div>
              <h1 className="tw-mb-0 tw-ml-3 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
                {wave.name}
              </h1>
            </button>
          ) : (
            <>
              <div className="tw-size-6 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950 lg:tw-size-9">
                <WavePicture
                  name={wave.name}
                  picture={wave.picture}
                  contributors={wave.contributors_overview.map((c) => ({
                    pfp: c.contributor_pfp,
                  }))}
                />
              </div>
              <h1 className="tw-mb-0 tw-ml-3 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
                {wave.name}
              </h1>
              {showGalleryToggle && (
                <button
                  type="button"
                  onClick={onToggleViewMode}
                  aria-label={
                    viewMode === "chat"
                      ? "Switch to gallery view"
                      : "Switch to chat view"
                  }
                  className="tw-ml-2 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
                >
                  {viewMode === "chat" ? (
                    <Squares2X2Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                  ) : (
                    <ChatBubbleLeftIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search messages in this wave"
                className="tw-ml-2 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
              >
                <MagnifyingGlassIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
              </button>
            </>
          )}
        </div>
        <div className="tw-relative tw-flex tw-items-center tw-self-stretch">
          <button
            type="button"
            onClick={toggleRightSidebar}
            className="tw-group tw-absolute tw-right-0 tw-top-1/2 tw-flex tw-h-8 tw-w-8 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-500/80 desktop-hover:hover:tw-bg-iron-700/85 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)]"
            aria-label="Toggle right sidebar"
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
      <div className="tw-border-b tw-border-l-0 tw-border-t-0 tw-border-solid tw-border-iron-800">
        <MyStreamWaveDesktopTabs
          activeTab={activeContentTab}
          wave={wave}
          setActiveTab={setActiveContentTab}
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
