import React, { useEffect, useState } from "react";
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
import PrimaryButton from "../../utils/button/PrimaryButton";
import { useLayout } from "./layout/LayoutContext";

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);
  const { tabsRef } = useLayout();

  // Get wave state information
  const { votingState, hasFirstDecisionPassed, isRollingWave } = useWaveState(
    wave || undefined
  );

  // State to trigger art submission from the parent component
  const [triggerArtSubmission, setTriggerArtSubmission] = useState(false);

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

  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab, updateAvailableTabs } =
    useContentTab();

  // Update available tabs when wave changes
  useEffect(() => {
    updateAvailableTabs(wave, votingState, hasFirstDecisionPassed);
  }, [wave, votingState, hasFirstDecisionPassed, updateAvailableTabs]);

  // Always switch to Chat for Chat-type waves
  useEffect(() => {
    if (wave?.wave.type === ApiWaveType.Chat) {
      setActiveContentTab(MyStreamWaveTab.CHAT);
    }
  }, [wave?.wave.type, setActiveContentTab]);

  if (!wave) {
    return null;
  }

  // Check if this is the specific Memes wave
  const isMemesWave =
    wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";

  // Check if this is a simple wave (no decision points, not rolling, not memes)
  const hasDecisionPoints = !!wave.wave.decisions_strategy?.first_decision_time;
  const hasMultipleDecisions = 
    !!wave.wave.decisions_strategy?.subsequent_decisions && 
    wave.wave.decisions_strategy.subsequent_decisions.length > 0;
  const isSimpleWave = !hasDecisionPoints && !hasMultipleDecisions && !isRollingWave && !isMemesWave;

  // Create component instances with wave-specific props
  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: (
      <MyStreamWaveChat 
        wave={wave} 
        isRollingWave={isRollingWave}
        isMemesWave={isMemesWave}
        isSimpleWave={isSimpleWave}
      />
    ),
    [MyStreamWaveTab.LEADERBOARD]: (
      <MyStreamWaveLeaderboard
        wave={wave}
        onDropClick={onDropClick}
        setSubmittingArtFromParent={triggerArtSubmission}
      />
    ),
    [MyStreamWaveTab.WINNERS]: (
      <WaveWinners wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.OUTCOME]: <MyStreamWaveOutcome wave={wave} />,
  };

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-h-full">
      {/* Don't render tab container at all for simple waves */}
      {breakpoint !== "S" && !isSimpleWave && (
        <div className="tw-flex-shrink-0" ref={tabsRef}>
          <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-w-full">
            {/* Combined row with tabs, title, and action button */}
            <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-x-3">
              <div>
                {!isMemesWave && (
                  <MyStreamWaveDesktopTabs
                    activeTab={activeContentTab}
                    wave={wave}
                    setActiveTab={setActiveContentTab}
                  />
                )}
              </div>

              {/* Right side: Tabs and action button for memes wave */}
              {isMemesWave && (
                <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-x-4">
                  <MyStreamWaveDesktopTabs
                    activeTab={activeContentTab}
                    wave={wave}
                    setActiveTab={setActiveContentTab}
                  />
                  <div className="tw-flex-shrink-0">
                    <PrimaryButton
                      padding="tw-px-2.5 tw-py-2"
                      loading={false}
                      disabled={false}
                      onClicked={() => {
                        // Switch to leaderboard tab and trigger art submission
                        setActiveContentTab(MyStreamWaveTab.LEADERBOARD);
                        setTriggerArtSubmission(true);

                        // Reset trigger after a delay to allow it to be triggered again later
                        setTimeout(() => {
                          setTriggerArtSubmission(false);
                        }, 500);
                      }}
                    >
                      Submit to Memes
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Use flex-grow to allow content to take remaining space */}
      <div className="tw-flex-grow tw-overflow-hidden">
        {components[activeContentTab]}
      </div>
    </div>
  );
};

export default MyStreamWave;
