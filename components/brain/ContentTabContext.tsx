import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { MyStreamWaveTab } from '../../types/waves.types';
import { ApiWave } from '../../generated/models/ApiWave';
import { ApiWaveType } from '../../generated/models/ApiWaveType';

export enum WaveVotingState {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
}

interface ContentTabContextType {
  activeContentTab: MyStreamWaveTab;
  setActiveContentTab: (tab: MyStreamWaveTab) => void;
  availableTabs: MyStreamWaveTab[];
  updateAvailableTabs: (wave: ApiWave | undefined, votingState?: WaveVotingState, firstDecisionDone?: boolean) => void;
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
  // Now takes the voting state parameters directly instead of using the hook
  const updateAvailableTabs = useCallback((
    wave: ApiWave | undefined, 
    votingState?: WaveVotingState, 
    hasFirstDecisionPassed?: boolean
  ) => {
    if (!wave) {
      setAvailableTabs([MyStreamWaveTab.CHAT]);
      
      // If current tab is not CHAT, switch to it
      if (activeContentTab !== MyStreamWaveTab.CHAT) {
        setActiveContentTabRaw(MyStreamWaveTab.CHAT);
      }
      return;
    }

    // Check if this is the Memes wave
    const isMemesWave = wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";

    // Chat-type waves only show chat tab
    if (wave.wave.type === ApiWaveType.Chat) {
      setAvailableTabs([MyStreamWaveTab.CHAT]);
      
      // If current tab is not CHAT, switch to it
      if (activeContentTab !== MyStreamWaveTab.CHAT) {
        setActiveContentTabRaw(MyStreamWaveTab.CHAT);
      }
      return;
    }
    
    // For Memes wave - don't set default tab, let it use standard behavior
    if (isMemesWave) {
      const tabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.LEADERBOARD];
      
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
