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
  hasPolls?: boolean | undefined;
  hasAuthenticatedProfile: boolean;
  isMemesWave: boolean;
  isCurationWave: boolean;
  isApproveWave?: boolean | undefined;
  showOutcomeTab?: boolean | undefined;
  votingState: WaveVotingState;
  hasFirstDecisionPassed: boolean;
  transientPreferredTab?: MyStreamWaveTab | null;
};

export interface SetActiveContentTabOptions {
  readonly persist?: boolean;
}

export type SetActiveContentTab = (
  tab: MyStreamWaveTab,
  options?: SetActiveContentTabOptions
) => void;

interface ContentTabContextType {
  activeContentTab: MyStreamWaveTab;
  setActiveContentTab: SetActiveContentTab;
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
  hasAuthenticatedProfile: boolean,
  votingState: WaveVotingState,
  hasFirstDecisionPassed: boolean,
  hasPolls: boolean,
  showOutcomeTab: boolean
) => {
  const tabs: MyStreamWaveTab[] = [];
  if (votingState === WaveVotingState.ENDED) {
    tabs.push(MyStreamWaveTab.SUBMISSIONS);
  } else {
    tabs.push(MyStreamWaveTab.LEADERBOARD);
  }
  tabs.push(MyStreamWaveTab.CHAT);
  if (hasFirstDecisionPassed) {
    tabs.push(MyStreamWaveTab.WINNERS);
  }
  if (hasAuthenticatedProfile) {
    tabs.push(MyStreamWaveTab.MY_VOTES);
  }
  if (hasPolls) {
    tabs.push(MyStreamWaveTab.POLLS);
  }
  if (showOutcomeTab) {
    tabs.push(MyStreamWaveTab.OUTCOME);
  }
  tabs.push(MyStreamWaveTab.FAQ);
  return tabs;
};

const buildDefaultTabs = (
  votingState: WaveVotingState,
  hasFirstDecisionPassed: boolean,
  isCurationWave: boolean,
  hasAuthenticatedProfile: boolean,
  hasPolls: boolean,
  showOutcomeTab: boolean
) => {
  const tabs: MyStreamWaveTab[] = [MyStreamWaveTab.CHAT];
  if (votingState === WaveVotingState.ENDED) {
    tabs.push(MyStreamWaveTab.SUBMISSIONS);
  } else {
    tabs.push(MyStreamWaveTab.LEADERBOARD);
  }
  if (isCurationWave) {
    tabs.push(MyStreamWaveTab.SALES);
  }
  if (hasFirstDecisionPassed) {
    tabs.push(MyStreamWaveTab.WINNERS);
  }
  if (!isCurationWave && showOutcomeTab) {
    tabs.push(MyStreamWaveTab.OUTCOME);
  }
  if (isCurationWave || hasAuthenticatedProfile) {
    tabs.push(MyStreamWaveTab.MY_VOTES);
  }
  if (hasPolls) {
    tabs.push(MyStreamWaveTab.POLLS);
  }
  return tabs;
};

const buildApproveTabs = (
  isCurationWave: boolean,
  hasAuthenticatedProfile: boolean,
  hasPolls: boolean,
  showOutcomeTab: boolean
) => {
  const tabs: MyStreamWaveTab[] = [
    MyStreamWaveTab.CHAT,
    MyStreamWaveTab.LEADERBOARD,
  ];

  if (isCurationWave) {
    tabs.push(MyStreamWaveTab.SALES);
  }

  tabs.push(MyStreamWaveTab.WINNERS);

  if (!isCurationWave && showOutcomeTab) {
    tabs.push(MyStreamWaveTab.OUTCOME);
  }

  if (isCurationWave) {
    tabs.push(MyStreamWaveTab.MY_VOTES);
  }

  if (!isCurationWave && hasAuthenticatedProfile) {
    tabs.push(MyStreamWaveTab.MY_VOTES);
  }

  if (hasPolls) {
    tabs.push(MyStreamWaveTab.POLLS);
  }

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
  const tabsByWaveIdRef = useRef<Record<string, MyStreamWaveTab>>(tabsByWaveId);
  const transientTabOverrideRef = useRef<{
    waveId: string;
    tab: MyStreamWaveTab;
  } | null>(null);

  useEffect(() => {
    tabsByWaveIdRef.current = tabsByWaveId;
  }, [tabsByWaveId]);

  const setActiveTabInternal = useCallback((tab: MyStreamWaveTab) => {
    setActiveContentTabRaw(tab);
  }, []);

  // Function to determine which tabs are available based on wave state
  // Now accepts a params object or null
  const updateAvailableTabs = useCallback(
    (params: WaveTabParams | null) => {
      if (!params) {
        setAvailableTabs([MyStreamWaveTab.CHAT]);
        currentWaveIdRef.current = null;
        transientTabOverrideRef.current = null;
        setActiveTabInternal(MyStreamWaveTab.CHAT);
        return;
      }

      const {
        waveId,
        isChatWave,
        hasPolls = false,
        hasAuthenticatedProfile,
        isMemesWave,
        isCurationWave,
        isApproveWave = false,
        showOutcomeTab = true,
        votingState,
        hasFirstDecisionPassed,
        transientPreferredTab,
      } = params;

      let tabs: MyStreamWaveTab[];
      if (isChatWave) {
        tabs = [MyStreamWaveTab.CHAT];
        if (hasPolls) {
          tabs.push(MyStreamWaveTab.POLLS);
        }
      } else if (isApproveWave) {
        tabs = buildApproveTabs(
          isCurationWave,
          hasAuthenticatedProfile,
          hasPolls,
          showOutcomeTab
        );
      } else if (isMemesWave) {
        tabs = buildMemesTabs(
          hasAuthenticatedProfile,
          votingState,
          hasFirstDecisionPassed,
          hasPolls,
          showOutcomeTab
        );
      } else {
        tabs = buildDefaultTabs(
          votingState,
          hasFirstDecisionPassed,
          isCurationWave,
          hasAuthenticatedProfile,
          hasPolls,
          showOutcomeTab
        );
      }

      if (
        transientTabOverrideRef.current !== null &&
        transientTabOverrideRef.current.waveId !== waveId
      ) {
        transientTabOverrideRef.current = null;
      }

      if (
        waveId !== null &&
        transientPreferredTab !== null &&
        transientPreferredTab !== undefined &&
        tabs.includes(transientPreferredTab)
      ) {
        transientTabOverrideRef.current = {
          waveId,
          tab: transientPreferredTab,
        };
      }

      setAvailableTabs(tabs);
      currentWaveIdRef.current = waveId ?? null;

      const transientTab =
        waveId !== null && transientTabOverrideRef.current?.waveId === waveId
          ? transientTabOverrideRef.current.tab
          : null;

      if (transientTab !== null && tabs.includes(transientTab)) {
        setActiveTabInternal(transientTab);
        return;
      }
      if (transientTab !== null) {
        transientTabOverrideRef.current = null;
      }

      const storedTab = waveId ? tabsByWaveIdRef.current[waveId] : undefined;
      let defaultTab = MyStreamWaveTab.CHAT;
      if (
        votingState === WaveVotingState.ENDED &&
        tabs.includes(MyStreamWaveTab.SUBMISSIONS)
      ) {
        defaultTab = MyStreamWaveTab.SUBMISSIONS;
      } else if (isMemesWave && tabs.includes(MyStreamWaveTab.LEADERBOARD)) {
        defaultTab = MyStreamWaveTab.LEADERBOARD;
      }

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
    (tab: MyStreamWaveTab, options?: SetActiveContentTabOptions) => {
      // Only set the tab if it's available
      if (availableTabs.includes(tab)) {
        setActiveTabInternal(tab);
        const waveId = currentWaveIdRef.current;
        if (options?.persist === false) {
          transientTabOverrideRef.current =
            waveId === null ? null : { waveId, tab };
          return;
        }
        transientTabOverrideRef.current = null;
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
        transientTabOverrideRef.current = null;
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
