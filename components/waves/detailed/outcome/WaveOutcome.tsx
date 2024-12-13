import React, { useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { WaveDetailedView } from "../WaveDetailed";
import { WaveDetailedOutcome } from "./WaveDetailedOutcome";
import WaveDetailedRightSidebar from "../WaveDetailedRightSidebar";
import useCapacitor from "../../../../hooks/useCapacitor";

interface WaveOutcomeProps {
  readonly wave: ApiWave;
  readonly activeTab: WaveDetailedView;
  readonly setActiveTab: (tab: WaveDetailedView) => void;
  readonly children?: React.ReactNode;
}

export const WaveOutcome: React.FC<WaveOutcomeProps> = ({
  wave,
  children,
}) => {
  const capacitor = useCapacitor();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  const contentHeight = capacitor.isCapacitor
    ? "tw-h-[calc(100vh-16rem)]"
    : "tw-h-[calc(100vh-8.5rem)]";

  return (
    <>
      <div className={`tw-w-full lg:tw-ml-[21.5rem] ${isSidebarOpen ? "xl:tw-mr-[20.5rem] 3xl:tw-mr-[28rem]" : ""} tw-transition-all tw-duration-300 lg:tw-pl-4 lg:tw-pr-4`}>
        {children}
        <div className={`tw-w-full no-scrollbar tw-overflow-y-auto ${contentHeight} tw-pb-6 tw-px-2 lg:tw-px-0 tw-pt-4 tw-space-y-4`}>
          {wave.outcomes.map((outcome, index) => (
            <WaveDetailedOutcome
              key={`${outcome.credit}-${outcome.type}-${index}`}
              outcome={outcome}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:tw-hidden tw-fixed tw-right-0 tw-border-0 tw-z-[100] tw-text-iron-500 desktop-hover:hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-700 tw-rounded-r-none tw-rounded-l-lg tw-size-8 tw-flex tw-items-center tw-justify-center tw-shadow-lg desktop-hover:hover:tw-shadow-primary-400/20 ${
          capacitor.isCapacitor ? "tw-top-[10.5rem]" : "tw-top-[6.25rem]"
        }`}
      >
        {isSidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
            className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        )}
      </button>

      <WaveDetailedRightSidebar 
        wave={wave}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onDropClick={() => {}}
      />
    </>
  );
};
