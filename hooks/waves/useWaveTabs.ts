import { useMemo, useState, useCallback, useEffect } from "react";
import { ApiWave } from "../../generated/models/ApiWave";
import { ApiWaveType } from "../../generated/models/ApiWaveType";
import { useWaveState, WaveVotingState } from "../useWaveState";
import { MyStreamWaveTab } from "../../components/brain/my-stream/MyStreamWave";

/**
 * Hook for managing wave tabs - which ones are visible, which is active
 */
export function useWaveTabs(wave?: ApiWave | null) {
  // Get wave state to determine which tabs are available
  const { votingState, hasFirstDecisionPassed, isDropsWave } = useWaveState(wave || undefined);
  
  // Default to Chat tab
  const [activeTab, setActiveTab] = useState<MyStreamWaveTab>(MyStreamWaveTab.CHAT);
  
  // Calculate available tabs based on wave state
  const availableTabs = useMemo(() => {
    // If no wave or chat-only wave, no tabs are available
    if (!wave || wave.wave.type === ApiWaveType.Chat) {
      return [];
    }
    
    const tabs = [MyStreamWaveTab.CHAT]; // Chat is always available
    
    // Show Leaderboard tab when voting hasn't ended
    if (votingState !== WaveVotingState.ENDED) {
      tabs.push(MyStreamWaveTab.LEADERBOARD);
    }
    
    // Show Winners tab if first decision has passed
    if (hasFirstDecisionPassed) {
      tabs.push(MyStreamWaveTab.WINNERS);
    }
    
    // Outcome tab is always available for non-chat waves
    tabs.push(MyStreamWaveTab.OUTCOME);
    
    return tabs;
  }, [wave, votingState, hasFirstDecisionPassed]);
  
  // Check if a tab is available
  const isTabAvailable = useCallback(
    (tab: MyStreamWaveTab) => availableTabs.includes(tab),
    [availableTabs]
  );
  
  // Safe way to change tabs, only if tab is available
  const switchTab = useCallback(
    (tab: MyStreamWaveTab) => {
      if (isTabAvailable(tab)) {
        setActiveTab(tab);
      }
    },
    [isTabAvailable]
  );
  
  // Auto-correct tab if current tab becomes unavailable
  useEffect(() => {
    if (availableTabs.length > 0 && !isTabAvailable(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab, isTabAvailable]);
  
  // Should tabs be shown at all?
  const shouldShowTabs = availableTabs.length > 1;
  
  return {
    availableTabs,
    activeTab,
    switchTab,
    shouldShowTabs,
    isTabAvailable
  };
}