"use client";

import type { ReactNode } from "react";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { MyStreamWaveTab } from "@/types/waves.types";
import useLocalPreference from "@/hooks/useLocalPreference";

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

const MEMES_WAVE_LAST_TAB_STORAGE_KEY = "memes_wave_last_tab_by_id";

const isValidWaveTab = (value: unknown): value is MyStreamWaveTab =>
  Object.values(MyStreamWaveTab).includes(value as MyStreamWaveTab);

const isValidWaveTabMap = (
  value: unknown
): value is Record<string, MyStreamWaveTab> => {
  if (value === null || value === undefined || typeof value !== "object") {
    return false;
  }

  return Object.values(value).every((tab) => isValidWaveTab(tab));
};

const buildMemesTabs = (
  votingState: WaveVotingState,
  hasFirstDecisionPassed: boolean
) => {
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
  return tabs;
};

const buildDefaultTabs = (
  votingState: WaveVotingState,
  hasFirstDecisionPassed: boolean
) => {
  const tabs: MyStreamWaveTab[] = [MyStreamWaveTab.CHAT];
  if (votingState !== WaveVotingState.ENDED) {
    tabs.push(MyStreamWaveTab.LEADERBOARD);
  }
  if (hasFirstDecisionPassed) {
    tabs.push(MyStreamWaveTab.WINNERS);
  }
  tabs.push(MyStreamWaveTab.OUTCOME);
  tabs.push(MyStreamWaveTab.MY_VOTES);
  return tabs;
};

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
  const [tabsByWaveId, setTabsByWaveId] = useLocalPreference<
    Record<string, MyStreamWaveTab>
  >(MEMES_WAVE_LAST_TAB_STORAGE_KEY, {}, isValidWaveTabMap);
  const [activeContentTabRaw, setActiveContentTabRaw] =
    useState<MyStreamWaveTab>(MyStreamWaveTab.CHAT);
  const [availableTabs, setAvailableTabs] = useState<MyStreamWaveTab[]>([
    MyStreamWaveTab.CHAT,
  ]);
  const currentWaveIdRef = useRef<string | null>(null);
  const activeContentTabRef = useRef<MyStreamWaveTab>(activeContentTabRaw);
  const tabsByWaveIdRef = useRef<Record<string, MyStreamWaveTab>>(tabsByWaveId);

  useEffect(() => {
    activeContentTabRef.current = activeContentTabRaw;
  }, [activeContentTabRaw]);

  useEffect(() => {
    tabsByWaveIdRef.current = tabsByWaveId;
  }, [tabsByWaveId]);

  const setActiveTabInternal = useCallback((tab: MyStreamWaveTab) => {
    setActiveContentTabRaw(tab);
    activeContentTabRef.current = tab;
  }, []);

  // Function to determine which tabs are available based on wave state
  // Now accepts a params object or null
  const updateAvailableTabs = useCallback(
    (params: WaveTabParams | null) => {
      if (!params) {
        setAvailableTabs([MyStreamWaveTab.CHAT]);
        currentWaveIdRef.current = null;
        setActiveTabInternal(MyStreamWaveTab.CHAT);
        return;
      }

      const {
        waveId,
        isChatWave,
        isMemesWave,
        votingState,
        hasFirstDecisionPassed,
      } = params;

      let tabs: MyStreamWaveTab[];
      if (isChatWave) {
        tabs = [MyStreamWaveTab.CHAT];
      } else if (isMemesWave) {
        tabs = buildMemesTabs(votingState, hasFirstDecisionPassed);
      } else {
        tabs = buildDefaultTabs(votingState, hasFirstDecisionPassed);
      }

      setAvailableTabs(tabs);
      currentWaveIdRef.current = waveId ?? null;

      const storedTab = waveId ? tabsByWaveIdRef.current[waveId] : undefined;
      const defaultTab =
        isMemesWave && tabs.includes(MyStreamWaveTab.LEADERBOARD)
          ? MyStreamWaveTab.LEADERBOARD
          : MyStreamWaveTab.CHAT;

      const nextTab =
        storedTab !== undefined && tabs.includes(storedTab)
          ? storedTab
          : defaultTab;

      setActiveTabInternal(nextTab);
    },
    [setActiveTabInternal]
  );

  // Wrapper for setActiveContentTab that validates the tab
  const setActiveContentTab = useCallback(
    (tab: MyStreamWaveTab) => {
      // Only set the tab if it's available
      if (availableTabs.includes(tab)) {
        setActiveTabInternal(tab);
        const waveId = currentWaveIdRef.current;
        if (waveId) {
          const nextMap = {
            ...tabsByWaveIdRef.current,
            [waveId]: tab,
          };
          tabsByWaveIdRef.current = nextMap;
          setTabsByWaveId(nextMap);
        }
      } else {
        // If tab is not available, default to CHAT
        setActiveTabInternal(MyStreamWaveTab.CHAT);
      }
    },
    [availableTabs, setActiveTabInternal, setTabsByWaveId]
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
