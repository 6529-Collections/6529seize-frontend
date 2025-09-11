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
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";
import WavePicture from "../../../waves/WavePicture";

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

  return (
    <>
      {" "}
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-y-3  tw-bg-iron-950">
        {/* Title, toggle button and submit button */}
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-4 tw-px-6 tw-pt-4">
          <div className="tw-flex tw-items-center tw-gap-x-3">
            <div className="tw-size-9 tw-flex-shrink-0 tw-ring-2 tw-ring-white/10 tw-rounded-full">
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
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <MyStreamWaveTabsMemeSubmit
              handleMemesSubmit={handleMemesSubmit}
              wave={wave}
            />
            {/* Right sidebar toggle button */}
            <button
              type="button"
              onClick={toggleRightSidebar}
              className="tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700 tw-transition-all tw-duration-200 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-border-iron-600 tw-shadow-sm tw-flex-shrink-0"
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

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
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
