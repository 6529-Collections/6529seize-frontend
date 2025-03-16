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
import PrimaryButton from "../../utils/button/PrimaryButton";
import { useLayout } from "./layout/LayoutContext";
import { useLayoutStabilizer } from "../../../hooks/useLayoutStabilizer";

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);
  const { tabsRef } = useLayout();
  
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
  
  // Measurement function that gets the tabs height
  const measureTabsHeight = useCallback(() => {
    if (tabsRef.current) {
      try {
        const height = tabsRef.current.getBoundingClientRect().height;
        return height > 0 ? height : null;
      } catch (e) {
        console.error("[MyStreamWave] Error measuring tabs height:", e);
        return null;
      }
    }
    return null;
  }, [tabsRef]);
  
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
  const isMemesWave = wave?.id?.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58" || false;
  const hasDecisionPoints = Boolean(wave?.wave?.decisions_strategy?.first_decision_time);
  const hasMultipleDecisions = Boolean(
    wave?.wave?.decisions_strategy?.subsequent_decisions && 
    wave?.wave?.decisions_strategy?.subsequent_decisions.length > 0
  );
  const isSimpleWave = wave ? (!hasDecisionPoints && !hasMultipleDecisions && !isRollingWave && !isMemesWave) : false;

  // Use the layout stabilizer to get stable measurements
  // Important: This must be called on every render, regardless of wave being available
  const { 
    height: stableTabsHeight, 
    stable: isMeasurementStable,
    forceUpdate: forceTabMeasurementUpdate
  } = useLayoutStabilizer({
    measureFn: measureTabsHeight,
    deps: [waveId, wave?.id, isRollingWave, isMemesWave, isSimpleWave, activeContentTab], 
    defaultHeight: 56, // Default tabs height
    debug: process.env.NODE_ENV === 'development',
  });
  
  // Force layout recalculation when tab changes - must be called before early return
  useEffect(() => {
    if (tabsRef.current) {
      // Give the DOM time to update
      const timerId = setTimeout(() => {
        if (mountedRef.current) {
          forceTabMeasurementUpdate();
        }
      }, 50);
      
      return () => clearTimeout(timerId);
    }
  }, [activeContentTab, tabsRef, forceTabMeasurementUpdate]);
  
  // Log stabilized measurements in development - must be called before early return
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isMeasurementStable) {
      console.log(`[MyStreamWave] Stable measurements for wave ${waveId}:`, {
        tabsHeight: stableTabsHeight,
        isSimpleWave,
        activeTab: activeContentTab,
        isMemesWave,
      });
    }
  }, [isMeasurementStable, stableTabsHeight, waveId, isSimpleWave, activeContentTab, isMemesWave]);
  
  // Early return if no wave data - all hooks must be called before this
  if (!wave) {
    return null;
  }

  // Create component instances with wave-specific props and stable measurements
  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: (
      <MyStreamWaveChat 
        wave={wave} 
        isRollingWave={isRollingWave}
        isMemesWave={isMemesWave}
        isSimpleWave={isSimpleWave}
        // Pass stable tabs height for consistent layout
        tabsHeight={isMeasurementStable ? stableTabsHeight : undefined}
      />
    ),
    [MyStreamWaveTab.LEADERBOARD]: (
      <MyStreamWaveLeaderboard
        wave={wave}
        onDropClick={onDropClick}
        setSubmittingArtFromParent={triggerArtSubmission}
        // Pass stable tabs height for consistent layout
        tabsHeight={isMeasurementStable ? stableTabsHeight : undefined}
      />
    ),
    [MyStreamWaveTab.WINNERS]: (
      <WaveWinners 
        wave={wave} 
        onDropClick={onDropClick}
        // Pass stable tabs height for consistent layout
        tabsHeight={isMeasurementStable ? stableTabsHeight : undefined}
      />
    ),
    [MyStreamWaveTab.OUTCOME]: (
      <MyStreamWaveOutcome 
        wave={wave}
        // Pass stable tabs height for consistent layout
        tabsHeight={isMeasurementStable ? stableTabsHeight : undefined}
      />
    ),
  };

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-h-full" key={stableWaveKey}>
      {/* Don't render tab container for simple waves */}
      {breakpoint !== "S" && !isSimpleWave && (
        <div className="tw-flex-shrink-0" ref={tabsRef} id="tabs-container">
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
                          if (mountedRef.current) {
                            setTriggerArtSubmission(false);
                          }
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
      
      {/* Add a spacer for simple waves to ensure content consistency */}
      {isSimpleWave && isMeasurementStable && (
        <div 
          className="tw-flex-shrink-0" 
          style={{ height: `${stableTabsHeight}px` }}
          aria-hidden="true"
          data-testid="simple-wave-spacer"
        />
      )}
      
      {/* Use flex-grow to allow content to take remaining space */}
      <div className="tw-flex-grow tw-overflow-hidden">
        {components[activeContentTab]}
      </div>
    </div>
  );
};

export default MyStreamWave;