import React, { useEffect, useState, useCallback, useRef } from "react";
import { useContentTab, WaveVotingState } from "../ContentTabContext";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import MyStreamWaveDesktopTabs from "./MyStreamWaveDesktopTabs";
import { useWaveData } from "../../../hooks/useWaveData";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { createBreakpoint } from "react-use";
import { useRouter } from "next/router";
import { WaveWinners } from "../../waves/winners/WaveWinners";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { useLayout } from "./layout/LayoutContext";
import MemesArtSubmissionModal from "../../waves/memes/MemesArtSubmissionModal";
import PrimaryButton from "../../utils/button/PrimaryButton";
import { useWave } from "../../../hooks/useWave";
import { useWaveTimers } from "../../../hooks/useWaveTimers";

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);
  const { isMemesWave, isChatWave } = useWave(wave);
  const {
    voting: { isUpcoming, isCompleted, isInProgress },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);
  const { registerRef } = useLayout();

  // Track mount status to prevent post-unmount updates
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Create a stable key for proper remounting
  const stableWaveKey = `wave-${waveId}`;

  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab, updateAvailableTabs } =
    useContentTab();

  // Reference to store tabs element for local measurements
  const tabsElementRef = useRef<HTMLDivElement | null>(null);
  const [isMemesModalOpen, setIsMemesModalOpen] = useState(false);

  // Callback function to set tabs element reference
  const setTabsRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      tabsElementRef.current = element;

      // Register with LayoutContext
      registerRef("tabs", element);
    },
    [registerRef]
  );

  // State to trigger art submission from the parent component
  const [triggerArtSubmission, setTriggerArtSubmission] = useState(false);

  // Update available tabs when wave changes
  useEffect(() => {
    const votingState = isUpcoming
      ? WaveVotingState.NOT_STARTED
      : isCompleted
      ? WaveVotingState.ENDED
      : WaveVotingState.ONGOING;
    updateAvailableTabs(wave, votingState, firstDecisionDone);
  }, [
    wave,
    isUpcoming,
    isCompleted,
    isInProgress,
    firstDecisionDone,
    updateAvailableTabs,
  ]);

  // Always switch to Chat for Chat-type waves
  useEffect(() => {
    if (wave?.wave?.type === ApiWaveType.Chat) {
      setActiveContentTab(MyStreamWaveTab.CHAT);
    }
  }, [wave?.wave?.type, setActiveContentTab]);

  // For handling clicks on drops
  const onDropClick = (drop: ExtendedDrop) => {
    const currentQuery = { ...router.query };
    currentQuery.drop = drop.id;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  // Early return if no wave data - all hooks must be called before this
  if (!wave) {
    return null;
  }

  // Create component instances with wave-specific props and stable measurements
  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: <MyStreamWaveChat wave={wave} />,
    [MyStreamWaveTab.LEADERBOARD]: (
      <MyStreamWaveLeaderboard wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.WINNERS]: (
      <WaveWinners wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.OUTCOME]: <MyStreamWaveOutcome wave={wave} />,
  };

  // Update your "Submit to Memes" button handler
  const handleMemesSubmit = () => {
    setIsMemesModalOpen(true);
  };

  return (
    <>
      <div
        className="tailwind-scope tw-relative tw-flex tw-flex-col tw-h-full"
        key={stableWaveKey}
      >
        {/* Don't render tab container for simple waves */}
        {breakpoint !== "S" && !isChatWave && (
          <div
            className="tw-flex-shrink-0"
            ref={setTabsRef}
            id="tabs-container"
          >
            <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-w-full">
              {/* Combined row with tabs, title, and action button */}
              <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-x-3">
                {!isMemesWave && (
                  <MyStreamWaveDesktopTabs
                    activeTab={activeContentTab}
                    wave={wave}
                    setActiveTab={setActiveContentTab}
                  />
                )}
                {/* Memes wave specific layout */}
                {isMemesWave && (
                  <div className="tw-w-full tw-flex tw-flex-col tw-gap-y-3 tw-mt-2">
                    {/* Title and Submit button */}
                    <div className="tw-flex tw-items-center tw-justify-between">
                      <h1 className="tw-text-2xl tw-font-semibold tw-text-iron-100 tw-mb-0">
                        Weekly Rolling Wave (Long-Term)
                      </h1>
                      <div className="tw-flex-shrink-0">
                        <PrimaryButton
                          loading={false}
                          disabled={false}
                          onClicked={handleMemesSubmit}
                          padding="tw-px-2.5 tw-py-2"
                        >
                          <svg
                            className="tw-w-5 tw-h-5 tw-flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M7.5 12H16.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 7.5V16.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>Submit Art for The Memes</span>
                        </PrimaryButton>
                      </div>
                    </div>

                    <MyStreamWaveDesktopTabs
                      activeTab={activeContentTab}
                      wave={wave}
                      setActiveTab={setActiveContentTab}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="tw-flex-grow tw-overflow-hidden">
          {components[activeContentTab]}
        </div>
      </div>

      {/* Add modal at root level */}
      <MemesArtSubmissionModal
        isOpen={isMemesModalOpen}
        onClose={() => setIsMemesModalOpen(false)}
        onSubmit={(artwork) => {
          console.log("Artwork submitted:", artwork);
          // Handle artwork submission here
          setIsMemesModalOpen(false);
        }}
      />
    </>
  );
};

export default MyStreamWave;
