import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { MyStreamWaveTab } from '../../types/waves.types';
import { ApiWave } from '../../generated/models/ApiWave';
import { ApiWaveType } from '../../generated/models/ApiWaveType';

export enum WaveVotingState {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
}

// Define a type for the updateAvailableTabs parameters
export type WaveTabParams = {
  isChatWave: boolean;
  isMemesWave: boolean;
  votingState: WaveVotingState;
  hasFirstDecisionPassed: boolean;
};

interface ContentTabContextType {
  activeContentTab: MyStreamWaveTab;
  setActiveContentTab: (tab: MyStreamWaveTab) => void;
  availableTabs: MyStreamWaveTab[];
  updateAvailableTabs: (params: WaveTabParams | null) => void;
}

// Create the context with a default value
const ContentTabContext = createContext<ContentTabContextType>({
  activeContentTab: MyStreamWaveTab.CHAT,
  setActiveContentTab: () => {},
  availableTabs: [MyStreamWaveTab.CHAT],
  updateAvailableTabs: () => {},
});

// Export a provider component
export const ContentTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeContentTab, setActiveContentTabRaw] = useState<MyStreamWaveTab>(MyStreamWaveTab.CHAT);
  const [availableTabs, setAvailableTabs] = useState<MyStreamWaveTab[]>([MyStreamWaveTab.CHAT]);

  // Function to determine which tabs are available based on wave state
  // Now accepts a params object or null
  const updateAvailableTabs = useCallback((params: WaveTabParams | null) => {
    if (!params) {
      setAvailableTabs([MyStreamWaveTab.CHAT]);
      
      // If current tab is not CHAT, switch to it
      if (activeContentTab !== MyStreamWaveTab.CHAT) {
        setActiveContentTabRaw(MyStreamWaveTab.CHAT);
      }
      return;
    }

    const { isChatWave, isMemesWave, votingState, hasFirstDecisionPassed } = params;

    // Chat-type waves only show chat tab
    if (isChatWave) {
      setAvailableTabs([MyStreamWaveTab.CHAT]);
      
      // If current tab is not CHAT, switch to it
      if (activeContentTab !== MyStreamWaveTab.CHAT) {
        setActiveContentTabRaw(MyStreamWaveTab.CHAT);
      }
      return;
    }
    
    // For Memes wave - don't set default tab, let it use standard behavior
    if (isMemesWave) {
      const tabs = [MyStreamWaveTab.CHAT];
      if (votingState !== WaveVotingState.ENDED) {
        tabs.push(MyStreamWaveTab.LEADERBOARD);
      }

      if (hasFirstDecisionPassed) {
        tabs.push(MyStreamWaveTab.WINNERS);
      }
      
      tabs.push(MyStreamWaveTab.OUTCOME);
      
      setAvailableTabs(tabs);
      
      // Only switch if the current tab is not available
      if (!tabs.includes(activeContentTab)) {
        setActiveContentTabRaw(MyStreamWaveTab.CHAT);
      }
      
      return;
    }
    
    // Default tabs
    const tabs: MyStreamWaveTab[] = [MyStreamWaveTab.CHAT];
    
    // Add Leaderboard if voting hasn't ended
    if (votingState !== WaveVotingState.ENDED) {
      tabs.push(MyStreamWaveTab.LEADERBOARD);
    }
    
    // Add Winners if first decision has passed
    if (hasFirstDecisionPassed) {
      tabs.push(MyStreamWaveTab.WINNERS);
    }
    
    // Always add Outcome
    tabs.push(MyStreamWaveTab.OUTCOME);
    
    // Update available tabs
    setAvailableTabs(tabs);
    
    // If current tab is no longer available, switch to a default available tab
    if (!tabs.includes(activeContentTab)) {
      // Prefer to switch to LEADERBOARD if available, otherwise CHAT
      if (tabs.includes(MyStreamWaveTab.LEADERBOARD)) {
        setActiveContentTabRaw(MyStreamWaveTab.LEADERBOARD);
      } else {
        setActiveContentTabRaw(MyStreamWaveTab.CHAT);
      }
    }
  }, [activeContentTab]);

  // Wrapper for setActiveContentTab that validates the tab
  const setActiveContentTab = useCallback((tab: MyStreamWaveTab) => {
    // Only set the tab if it's available
    if (availableTabs.includes(tab)) {
      setActiveContentTabRaw(tab);
    } else {
      // If tab is not available, default to CHAT
      setActiveContentTabRaw(MyStreamWaveTab.CHAT);
    }
  }, [availableTabs]);

  return (
    <ContentTabContext.Provider value={{ 
      activeContentTab, 
      setActiveContentTab,
      availableTabs,
      updateAvailableTabs
    }}>
      {children}
    </ContentTabContext.Provider>
  );
};

// Export a hook for using the context
export const useContentTab = () => useContext(ContentTabContext);
