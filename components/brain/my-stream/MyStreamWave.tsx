import React, { useEffect, useState, useCallback, useRef } from "react";
import { useContentTab } from "../ContentTabContext";
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
import { useWaveState } from "../../../hooks/useWaveState";
import { useLayout } from "./layout/LayoutContext";
import MemesArtSubmissionModal from '../../waves/memes/MemesArtSubmissionModal';

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);
  const { registerRef } = useLayout();

  // Track mount status to prevent post-unmount updates
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Get wave state information
  const { votingState, hasFirstDecisionPassed, isRollingWave } = useWaveState(
    wave || undefined
  );

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

  // Measurement function that gets the tabs height
  const measureTabsHeight = useCallback(() => {
    if (tabsElementRef.current) {
      try {
        const height = tabsElementRef.current.getBoundingClientRect().height;
        return height > 0 ? height : null;
      } catch (e) {
        console.error("[MyStreamWave] Error measuring tabs height:", e);
        return null;
      }
    }
    return null;
  }, []);

  // State to trigger art submission from the parent component
  const [triggerArtSubmission, setTriggerArtSubmission] = useState(false);

  // Update available tabs when wave changes
  useEffect(() => {
    updateAvailableTabs(wave, votingState, hasFirstDecisionPassed);
  }, [wave, votingState, hasFirstDecisionPassed, updateAvailableTabs]);

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

  // Initialize wave type variables with default values
  const isMemesWave =
    wave?.id?.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58" || false;
  const hasDecisionPoints = Boolean(
    wave?.wave?.decisions_strategy?.first_decision_time
  );
  const hasMultipleDecisions = Boolean(
    wave?.wave?.decisions_strategy?.subsequent_decisions &&
      wave?.wave?.decisions_strategy?.subsequent_decisions.length > 0
  );
  const isSimpleWave = wave
    ? !hasDecisionPoints &&
      !hasMultipleDecisions &&
      !isRollingWave &&
      !isMemesWave
    : false;

  // Early return if no wave data - all hooks must be called before this
  if (!wave) {
    return null;
  }

  // Create component instances with wave-specific props and stable measurements
  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: <MyStreamWaveChat wave={wave} />,
    [MyStreamWaveTab.LEADERBOARD]: (
      <MyStreamWaveLeaderboard
        wave={wave}
        onDropClick={onDropClick}
      />
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
        className="tw-relative tw-flex tw-flex-col tw-h-full"
        key={stableWaveKey}
      >
        {/* Don't render tab container for simple waves */}
        {breakpoint !== "S" && !isSimpleWave && (
          <div className="tw-flex-shrink-0" ref={setTabsRef} id="tabs-container">
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
                {/* Right side: Tabs and action button for memes wave */}
                {isMemesWave && (
                  <div className="tw-w-full tw-flex tw-flex-col tw-gap-y-1">
                    <div className="tw-text-2xl tw-font-semibold">
                      Weekly Rolling Wave (Long-Term)
                    </div>
                    <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-4">
                      <MyStreamWaveDesktopTabs
                        activeTab={activeContentTab}
                        wave={wave}
                        setActiveTab={setActiveContentTab}
                      />
                      <div className="tw-flex-shrink-0 tw-mb-2">
                        <button
                          className="tw-bg-transparent tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white tw-font-semibold tw-py-2 tw-px-2.5 tw-text-sm tw-rounded-lg tw-transition-all tw-duration-200 focus:tw-outline-none active:tw-scale-98 tw-flex tw-items-center tw-gap-2"
                          onClick={handleMemesSubmit}
                        >
                          <svg
                            className="tw-w-4 tw-h-4 tw-flex-shrink-0"
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
                          <span>Submit to Memes</span>
                        </button>
                      </div>
                    </div>
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
