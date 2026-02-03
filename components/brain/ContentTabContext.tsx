"use client";

import type { ReactNode } from "react";
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { MyStreamWaveTab } from "@/types/waves.types";

export enum WaveVotingState {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
}

// Define a type for the updateAvailableTabs parameters
type WaveTabParams = {
  waveId: string | null;
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
export const ContentTabProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeContentTabRaw, setActiveContentTabRaw] =
    useState<MyStreamWaveTab>(MyStreamWaveTab.CHAT);
  const [availableTabs, setAvailableTabs] = useState<MyStreamWaveTab[]>([
    MyStreamWaveTab.CHAT,
  ]);
  const lastWaveIdRef = useRef<string | null>(null);

  // Function to determine which tabs are available based on wave state
  // Now accepts a params object or null
  const updateAvailableTabs = useCallback(
    (params: WaveTabParams | null) => {
      if (!params) {
        setAvailableTabs([MyStreamWaveTab.CHAT]);
        lastWaveIdRef.current = null;

        // If current tab is not CHAT, switch to it
        if (activeContentTabRaw !== MyStreamWaveTab.CHAT) {
          setActiveContentTabRaw(MyStreamWaveTab.CHAT);
        }
        return;
      }

      const {
        waveId,
        isChatWave,
        isMemesWave,
        votingState,
        hasFirstDecisionPassed,
      } = params;

      // Chat-type waves only show chat tab
      if (isChatWave) {
        setAvailableTabs([MyStreamWaveTab.CHAT]);

        // If current tab is not CHAT, switch to it
        if (activeContentTabRaw !== MyStreamWaveTab.CHAT) {
          setActiveContentTabRaw(MyStreamWaveTab.CHAT);
        }
        lastWaveIdRef.current = waveId ?? null;
        return;
      }

      // For Memes wave - don't set default tab, let it use standard behavior
      if (isMemesWave) {
        const tabs: MyStreamWaveTab[] = [];
        if (votingState !== WaveVotingState.ENDED) {
          tabs.push(MyStreamWaveTab.LEADERBOARD);
        }
        tabs.push(MyStreamWaveTab.CHAT);
        if (hasFirstDecisionPassed) {
          tabs.push(MyStreamWaveTab.WINNERS);
        }
        tabs.push(MyStreamWaveTab.MY_VOTES);
        tabs.push(MyStreamWaveTab.OUTCOME);
        tabs.push(MyStreamWaveTab.FAQ);

        setAvailableTabs(tabs);

        const isNewWave = !!waveId && waveId !== lastWaveIdRef.current;

        if (isNewWave) {
          if (tabs.includes(MyStreamWaveTab.LEADERBOARD)) {
            setActiveContentTabRaw(MyStreamWaveTab.LEADERBOARD);
          } else {
            setActiveContentTabRaw(MyStreamWaveTab.CHAT);
          }
        } else if (!tabs.includes(activeContentTabRaw)) {
          if (tabs.includes(MyStreamWaveTab.LEADERBOARD)) {
            setActiveContentTabRaw(MyStreamWaveTab.LEADERBOARD);
          } else {
            setActiveContentTabRaw(MyStreamWaveTab.CHAT);
          }
        }

        lastWaveIdRef.current = waveId ?? null;
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
      tabs.push(MyStreamWaveTab.MY_VOTES);

      // FAQ tab is only available for Memes waves, which is handled in the isMemesWave block above

      // Update available tabs
      setAvailableTabs(tabs);

      // If current tab is no longer available, switch to a default available tab
      if (!tabs.includes(activeContentTabRaw)) {
        // Prefer to switch to LEADERBOARD if available, otherwise CHAT
        if (tabs.includes(MyStreamWaveTab.LEADERBOARD)) {
          setActiveContentTabRaw(MyStreamWaveTab.LEADERBOARD);
        } else {
          setActiveContentTabRaw(MyStreamWaveTab.CHAT);
        }
      }

      lastWaveIdRef.current = waveId ?? null;
    },
    [activeContentTabRaw]
  );

  // Wrapper for setActiveContentTab that validates the tab
  const setActiveContentTab = useCallback(
    (tab: MyStreamWaveTab) => {
      // Only set the tab if it's available
      if (availableTabs.includes(tab)) {
        setActiveContentTabRaw(tab);
      } else {
        // If tab is not available, default to CHAT
        setActiveContentTabRaw(MyStreamWaveTab.CHAT);
      }
    },
    [availableTabs]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      activeContentTab: activeContentTabRaw,
      setActiveContentTab,
      availableTabs,
      updateAvailableTabs,
    }),
    [
      activeContentTabRaw,
      setActiveContentTab,
      availableTabs,
      updateAvailableTabs,
    ]
  );

  return (
    <ContentTabContext.Provider value={contextValue}>
      {children}
    </ContentTabContext.Provider>
  );
};

// Export a hook for using the context
export const useContentTab = () => useContext(ContentTabContext);
