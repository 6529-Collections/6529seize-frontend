"use client";

import React, { useEffect, useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import { useContentTab } from "../../ContentTabContext";
import MemesArtSubmissionModal from "../../../waves/memes/MemesArtSubmissionModal";
import MyStreamWaveTabsMemeSubmit from "./MyStreamWaveTabsMemeSubmit";
import { useWave } from "../../../../hooks/useWave";
import { useDecisionPoints } from "../../../../hooks/waves/useDecisionPoints";
import { Time } from "../../../../helpers/time";
import {
  calculateTimeLeft,
  TimeLeft,
} from "../../../../helpers/waves/time.utils";
import { CompactTimeCountdown } from "../../../waves/leaderboard/time/CompactTimeCountdown";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import { ChevronDoubleLeftIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import WavePicture from "../../../waves/WavePicture";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createBreakpoint } from "react-use";

// Breakpoint for mobile responsiveness (lg = 1024px)
const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

interface MyStreamWaveTabsMemeProps {
  readonly wave: ApiWave;
}

const MyStreamWaveTabsMeme: React.FC<MyStreamWaveTabsMemeProps> = ({
  wave,
}) => {
  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarState();
  const [isMemesModalOpen, setIsMemesModalOpen] = useState(false);

  // Navigation hooks for mobile back button
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "S";

  // Wave hooks for countdown functionality
  const {
    isMemesWave,
    isRankWave,
    pauses: { filterDecisionsDuringPauses },
  } = useWave(wave);

  // For next decision countdown
  const { allDecisions } = useDecisionPoints(wave);

  // Filter out decisions that occur during pause periods using the helper from useWave
  const filteredDecisions = React.useMemo(() => {
    // Convert DecisionPoint[] to ApiWaveDecision[] format for the filter function
    const decisionsAsApiFormat = allDecisions.map(
      (decision) =>
        ({
          decision_time: decision.timestamp,
        } as any)
    );

    // Apply the filter
    const filtered = filterDecisionsDuringPauses(decisionsAsApiFormat);

    // Convert back to DecisionPoint[] format
    return allDecisions.filter((decision) =>
      filtered.some((f) => f.decision_time === decision.timestamp)
    );
  }, [allDecisions, filterDecisionsDuringPauses]);

  // Get the next valid decision time (excluding paused decisions)
  const nextDecisionTime =
    filteredDecisions.find(
      (decision) => decision.timestamp > Time.currentMillis()
    )?.timestamp ?? null;

  // Calculate time left for next decision
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Initial calculation
    if (nextDecisionTime) {
      setTimeLeft(calculateTimeLeft(nextDecisionTime));
    }

    // Only set up interval if there's a next decision
    if (nextDecisionTime) {
      const intervalId = setInterval(() => {
        const newTimeLeft = calculateTimeLeft(nextDecisionTime);
        setTimeLeft(newTimeLeft);

        // Clear interval when countdown reaches zero
        if (
          newTimeLeft.days === 0 &&
          newTimeLeft.hours === 0 &&
          newTimeLeft.minutes === 0 &&
          newTimeLeft.seconds === 0
        ) {
          clearInterval(intervalId);
        }
      }, 1000);

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [nextDecisionTime]);

  // Update your "Submit to Memes" button handler
  const handleMemesSubmit = () => {
    setIsMemesModalOpen(true);
  };

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
    <>
      {" "}
      <div className="tw-w-full tw-flex tw-flex-col tw-bg-iron-950">
        {/* Title, toggle button and submit button */}
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4 tw-px-6 tw-py-3">
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
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-hidden lg:tw-block">
              <MyStreamWaveTabsMemeSubmit
                handleMemesSubmit={handleMemesSubmit}
                wave={wave}
              />
            </div>
            {/* Right sidebar toggle button */}
            <button
              type="button"
              onClick={toggleRightSidebar}
              className="tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800/85 tw-border tw-border-iron-700/70 tw-border-solid tw-backdrop-blur-sm tw-transition-all tw-duration-200 tw-shadow-[0_10px_24px_rgba(0,0,0,0.45)] desktop-hover:hover:tw-bg-iron-700/95 desktop-hover:hover:tw-border-iron-500/70 desktop-hover:hover:tw-shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
              aria-label="Toggle right sidebar"
            >
              <ChevronDoubleLeftIcon
                strokeWidth={3}
                className={`tw-h-4 tw-w-4 tw-text-iron-300 group-hover:hover:tw-text-iron-200 tw-transition-all tw-duration-200 ${
                  isRightSidebarOpen ? "tw-rotate-180" : "tw-rotate-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-y tw-border-solid tw-border-iron-700 tw-border-x-0">
          <MyStreamWaveDesktopTabs
            activeTab={activeContentTab}
            wave={wave}
            setActiveTab={setActiveContentTab}
          />
          {/* Next winner announcement for memes and rank waves, only if there's an upcoming decision */}
          {(isMemesWave || isRankWave) && nextDecisionTime && (
            <div className="tw-flex-shrink-0 tw-px-2 sm:tw-px-4 md:tw-px-6">
              <CompactTimeCountdown timeLeft={timeLeft} />
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
