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
import { useCompetitionNavigation } from "@/contexts/CompetitionNavigationContext";
import useLocalPreference from "@/hooks/useLocalPreference";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getCompetitionRoute,
  getCompetitionsRoute,
  isCompetitionPathname,
  getCompetitionIdFromPathname,
} from "@/helpers/competition.helpers";
import {
  getLegacyCompetitionTab,
  waveCompetitionTabs,
} from "@/helpers/default-competition.helpers";
import {
  getWaveIdFromPathname,
  getWavePathRoute,
} from "@/helpers/navigation.helpers";

const getSharedWaveTabRoute = (pathname: string, tab: MyStreamWaveTab) => {
  const waveId = getWaveIdFromPathname(pathname);
  if (!waveId) return null;
  const params = new URLSearchParams({ tab: tab.toLowerCase() });
  const competitionId = getCompetitionIdFromPathname(pathname);
  if (competitionId) params.set("competition", competitionId);
  return `${getWavePathRoute(waveId)}?${params}`;
};

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
  hasCompetitions?: boolean | undefined;
  hideCompetitionsTab?: boolean | undefined;
  hasCompetitionConfiguration?: boolean | undefined;
  defaultCompetitionId?: string | null | undefined;
  defaultSelectionEnabled?: boolean | undefined;
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
export const ContentTabProvider: React.FC<{
  children: ReactNode;
  respectCompetitionRoute?: boolean;
  competitionOnly?: boolean;
}> = ({
  children,
  respectCompetitionRoute = true,
  competitionOnly = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const { flat, nativeCompetition } = useCompetitionNavigation();
  const isCompetitionRoute =
    respectCompetitionRoute &&
    !competitionOnly &&
    isCompetitionPathname(pathname);
  const initialTab = competitionOnly
    ? MyStreamWaveTab.LEADERBOARD
    : MyStreamWaveTab.CHAT;
  const routeKey = `${pathname}:${search.get("wave") ?? ""}:${search.get("tab") ?? ""}:${search.get("serialNo") ?? ""}:${search.get("competition") ?? ""}`;
  const routeToken = useMemo(() => Symbol(routeKey), [routeKey]);
  const [tabsByWaveId, setTabsByWaveId] = useLocalPreference<
    Record<string, MyStreamWaveTab>
  >(
    competitionOnly
      ? "legacy_competition_last_tab_by_id"
      : MEMES_WAVE_LAST_TAB_STORAGE_KEY,
    {},
    isValidWaveTabMap
  );
  const [selection, setSelection] = useState({
    routeToken,
    waveId: null as string | null,
    tab: initialTab,
  });
  const activeContentTabRaw =
    selection.routeToken === routeToken ? selection.tab : initialTab;
  const [availableTabs, setAvailableTabs] = useState<MyStreamWaveTab[]>([
    initialTab,
  ]);
  const [registeredWaveId, setRegisteredWaveId] = useState<string | null>(null);
  const currentWaveIdRef = useRef<string | null>(null);
  const defaultCompetitionRef = useRef<{ id: string | null; enabled: boolean }>(
    { id: null, enabled: false }
  );
  const [hideCompetitionsTab, setHideCompetitionsTab] = useState(false);
  const tabsByWaveIdRef = useRef<Record<string, MyStreamWaveTab>>(tabsByWaveId);
  const transientTabOverrideRef = useRef<{
    waveId: string;
    tab: MyStreamWaveTab;
  } | null>(null);

  useEffect(() => {
    tabsByWaveIdRef.current = tabsByWaveId;
  }, [tabsByWaveId]);

  const setActiveTabInternal = useCallback(
    (tab: MyStreamWaveTab) => {
      setSelection({ routeToken, waveId: currentWaveIdRef.current, tab });
    },
    [routeToken]
  );

  // Function to determine which tabs are available based on wave state
  // Now accepts a params object or null
  const updateAvailableTabs = useCallback(
    (params: WaveTabParams | null) => {
      if (!params) {
        setAvailableTabs([initialTab]);
        setRegisteredWaveId(null);
        currentWaveIdRef.current = null;
        transientTabOverrideRef.current = null;
        setActiveTabInternal(initialTab);
        return;
      }

      const {
        waveId,
        isChatWave,
        hasPolls = false,
        hasCompetitions = false,
        hideCompetitionsTab: hideCollection = false,
        hasCompetitionConfiguration = false,
        defaultCompetitionId = null,
        defaultSelectionEnabled = false,
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

      if (hasCompetitions && !hideCollection) {
        tabs.push(MyStreamWaveTab.COMPETITIONS);
      }

      if (isChatWave && defaultCompetitionId) {
        tabs.push(
          MyStreamWaveTab.LEADERBOARD,
          MyStreamWaveTab.WINNERS,
          MyStreamWaveTab.OUTCOME
        );
        if (hasAuthenticatedProfile) tabs.push(MyStreamWaveTab.MY_VOTES);
      }

      if (competitionOnly) {
        tabs = tabs.filter(
          (tab) =>
            tab !== MyStreamWaveTab.CHAT &&
            tab !== MyStreamWaveTab.COMPETITIONS &&
            tab !== MyStreamWaveTab.POLLS
        );
      }
      if (hasCompetitionConfiguration) tabs.push(MyStreamWaveTab.CONFIGURATION);
      if (!competitionOnly) tabs.push(MyStreamWaveTab.ABOUT);

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
      setRegisteredWaveId(waveId ?? null);
      setHideCompetitionsTab(hideCollection);
      currentWaveIdRef.current = waveId ?? null;
      defaultCompetitionRef.current = {
        id: defaultCompetitionId,
        enabled: defaultSelectionEnabled,
      };

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

      if (!competitionOnly) {
        // Preserve an intentional selection while queries register more tabs.
        // A fresh route or wave always starts in the shared conversation.
        setSelection((current) => {
          let tab = MyStreamWaveTab.CHAT;
          if (current.routeToken === routeToken && current.waveId === waveId) {
            if (tabs.includes(current.tab)) tab = current.tab;
            else if (
              current.tab === MyStreamWaveTab.LEADERBOARD &&
              tabs.includes(MyStreamWaveTab.SUBMISSIONS)
            )
              tab = MyStreamWaveTab.SUBMISSIONS;
          }
          return { routeToken, waveId, tab };
        });
        return;
      }
      const storedTab = waveId ? tabsByWaveIdRef.current[waveId] : undefined;
      const nextTab =
        storedTab !== undefined && tabs.includes(storedTab)
          ? storedTab
          : (tabs[0] ?? initialTab);

      setActiveTabInternal(nextTab);
    },
    [competitionOnly, initialTab, routeToken, setActiveTabInternal]
  );

  const navigateToTab = useCallback(
    (tab: MyStreamWaveTab, waveId: string | null) => {
      if (waveId && competitionOnly) {
        const params = new URLSearchParams(search.toString());
        params.delete("default");
        params.set("tab", waveCompetitionTabs[tab] ?? tab.toLowerCase());
        router.push(`${pathname}?${params}`, { scroll: false });
      }
      const competitionTab = waveCompetitionTabs[tab];
      if (
        waveId &&
        isCompetitionRoute &&
        tab === MyStreamWaveTab.COMPETITIONS
      ) {
        router.push(getCompetitionsRoute(waveId), { scroll: false });
        return true;
      }
      if (
        waveId &&
        !competitionOnly &&
        competitionTab &&
        defaultCompetitionRef.current.enabled
      ) {
        const selectedId =
          getCompetitionIdFromPathname(pathname) ??
          search.get("competition") ??
          defaultCompetitionRef.current.id;
        const target = selectedId
          ? `${getCompetitionRoute(waveId, selectedId)}?tab=${competitionTab}`
          : `${getWavePathRoute(waveId)}?tab=${tab.toLowerCase()}`;
        router.push(target, { scroll: false });
        return true;
      }
      if (isCompetitionRoute && tab !== MyStreamWaveTab.COMPETITIONS) {
        const target = getSharedWaveTabRoute(pathname, tab);
        if (target) router.push(target, { scroll: false });
      }
      if (
        waveId &&
        !competitionOnly &&
        !isCompetitionRoute &&
        (search.has("tab") || defaultCompetitionRef.current.enabled)
      ) {
        const params = new URLSearchParams(search.toString());
        params.delete("default");
        params.set("tab", tab.toLowerCase());
        router.replace(`${pathname}?${params}`, { scroll: false });
      }
      return false;
    },
    [competitionOnly, isCompetitionRoute, pathname, router, search]
  );

  // Wrapper for setActiveContentTab that validates the tab
  const setActiveContentTab = useCallback(
    (tab: MyStreamWaveTab, options?: SetActiveContentTabOptions) => {
      const isVisibleCollectionTab =
        isCompetitionRoute && tab === MyStreamWaveTab.COMPETITIONS;
      if (!availableTabs.includes(tab) && !isVisibleCollectionTab) {
        // Keep unavailable selections inside the current view's tabs.
        transientTabOverrideRef.current = null;
        setActiveTabInternal(
          competitionOnly
            ? (availableTabs[0] ?? initialTab)
            : MyStreamWaveTab.CHAT
        );
        return;
      }
      const waveId = currentWaveIdRef.current;
      // Routed tabs become interactive in their destination layout. Selecting
      // them here first exposes a temporary view that navigation will unmount.
      if (navigateToTab(tab, waveId)) return;
      setActiveTabInternal(tab);
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
    },
    [
      availableTabs,
      setActiveTabInternal,
      setTabsByWaveId,
      navigateToTab,
      competitionOnly,
      initialTab,
      isCompetitionRoute,
    ]
  );

  const requestedTab = competitionOnly
    ? getLegacyCompetitionTab(search.get("tab"))
    : Object.values(MyStreamWaveTab).find(
        (tab) => tab.toLowerCase() === search.get("tab")
      );
  let activeContentTab = activeContentTabRaw;
  if (isCompetitionRoute) {
    activeContentTab = MyStreamWaveTab.COMPETITIONS;
    if (flat) {
      const tab =
        nativeCompetition && search.get("edit") === "1"
          ? "rules"
          : (search.get("tab") ?? "leaderboard");
      let mapped = getLegacyCompetitionTab(tab);
      if (
        mapped === MyStreamWaveTab.LEADERBOARD &&
        availableTabs.includes(MyStreamWaveTab.SUBMISSIONS)
      )
        mapped = MyStreamWaveTab.SUBMISSIONS;
      // Honor canonical links while the wave is loading; apply its gates after registration.
      if (mapped !== undefined) {
        const fallback = availableTabs.includes(MyStreamWaveTab.SUBMISSIONS)
          ? MyStreamWaveTab.SUBMISSIONS
          : MyStreamWaveTab.LEADERBOARD;
        activeContentTab =
          registeredWaveId !== getWaveIdFromPathname(pathname) ||
          availableTabs.includes(mapped)
            ? mapped
            : fallback;
      }
    }
  } else if (
    (competitionOnly || search.get("serialNo") === null) &&
    requestedTab !== undefined &&
    (availableTabs.includes(requestedTab) ||
      (hideCompetitionsTab && requestedTab === MyStreamWaveTab.COMPETITIONS))
  ) {
    activeContentTab = requestedTab;
  }
  const visibleTabs = useMemo(() => {
    if (!isCompetitionRoute) return availableTabs;
    const tabs = [...availableTabs];
    if (!hideCompetitionsTab && !tabs.includes(MyStreamWaveTab.COMPETITIONS)) {
      tabs.splice(
        tabs.indexOf(MyStreamWaveTab.CHAT) + 1,
        0,
        MyStreamWaveTab.COMPETITIONS
      );
    }
    return tabs;
  }, [availableTabs, isCompetitionRoute, hideCompetitionsTab]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      activeContentTab,
      setActiveContentTab,
      availableTabs: visibleTabs,
      updateAvailableTabs,
    }),
    [activeContentTab, setActiveContentTab, visibleTabs, updateAvailableTabs]
  );

  return (
    <ContentTabContext.Provider value={contextValue}>
      {children}
    </ContentTabContext.Provider>
  );
};

// Export a hook for using the context
export const useContentTab = () => useContext(ContentTabContext);
