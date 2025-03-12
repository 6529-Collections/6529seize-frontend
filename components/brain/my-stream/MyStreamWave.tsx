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

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);

  // Get wave state information
  const { votingState, hasFirstDecisionPassed } = useWaveState(
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

  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: <MyStreamWaveChat wave={wave} />,
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

  const isMemesWave =
    wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";

  return (
    <div className="tw-relative">
      {breakpoint !== "S" && (
        <div>
          <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-sticky tw-top-0 tw-z-50">
            <MyStreamWaveDesktopTabs
              activeTab={activeContentTab}
              wave={wave}
              setActiveTab={setActiveContentTab}
            />
          </div>

          {/* Title and Submit to Memes button - only for Memes wave types, across all tabs */}
          {isMemesWave && (
            <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-mt-4 tw-mb-3">
              <div className="tw-flex tw-items-center tw-gap-4 tw-justify-between">
                {/* Title on far left */}
                <h2 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-whitespace-nowrap tw-flex-shrink-0">
                  {wave.name}
                </h2>

                {/* PrimaryButton on far right */}
                <PrimaryButton
                  padding="tw-px-3 tw-py-2"
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
      )}
      <div>{components[activeContentTab]}</div>
    </div>
  );
};

export default MyStreamWave;
