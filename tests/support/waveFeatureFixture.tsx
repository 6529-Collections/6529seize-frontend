// Isolated component fixture. Its bundler replaces provider/data dependencies,
// but uses the production components, telemetry helpers and pinned Mixpanel SDK.
import { createContext, useContext, useState } from "react";
import { createRoot } from "react-dom/client";
import mixpanel from "mixpanel-browser";
import type { ApiWave } from "@/generated/models/ApiWave";
import { MyStreamWaveTab } from "@/types/waves.types";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { SidebarDiscovery } from "@/components/brain/left-sidebar/waves/SidebarDiscovery";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import MyStreamWaveDesktopTabs from "@/components/brain/my-stream/MyStreamWaveDesktopTabs";
import { SidebarWaveNavigationControls } from "@/components/brain/left-sidebar/waves/SidebarWaveNavigation";
import type { SidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";
import { WebProfileFeedShortcut } from "@/components/brain/left-sidebar/web/WebProfileFeedShortcut";
import type {} from "./waveFeatureFixtureApi";
import { queueFixture } from "./waveFeatureQueueFixture";
import { resetWaveFeatureVisit } from "@/services/analytics/waveFeatureUsage";
import { WaveleaderboardSort } from "@/components/waves/leaderboard/header/WaveleaderboardSort";
import {
  clearIdentity,
  disableAnalytics,
  identify,
  initAnalytics,
  trackAnalyticsEvent,
} from "@/services/analytics/mixpanel";

export const AuthContext = createContext({
  connectedProfile: null,
  activeProfileProxy: null,
});
export const useAuth = () => useContext(AuthContext);
const ConsentContext = createContext({ performanceConsent: false });
export const useOptionalCookieConsent = () => useContext(ConsentContext);
export const useCookieConsent = useOptionalCookieConsent;
export const tabs = [
  MyStreamWaveTab.CHAT,
  MyStreamWaveTab.LEADERBOARD,
  MyStreamWaveTab.WINNERS,
  MyStreamWaveTab.ABOUT,
];
const wave = {
  id: "fixture-wave",
  author: { id: "fixture-author" },
  wave: { authenticated_user_eligible_for_admin: false },
} as unknown as ApiWave;
const recommendationWave: MinimalWave = {
  id: "private-recommendation",
  name: "Synthetic recommendation",
  type: ApiWaveType.Chat,
  createdAt: 0,
  newDropsCount: {
    count: 0,
    latestDropTimestamp: null,
    firstUnreadSerialNo: null,
  },
  picture: null,
  contributors: [],
  isPinned: false,
  isFollowing: false,
  isOfficial: false,
  isMuted: false,
  parentWaveId: null,
  hasSubwaves: false,
  followedSubwavesCount: 0,
  latestFollowedSubwaveDropTimestamp: null,
  unreadSubwaveDrops: 0,
  unreadDropsCount: 0,
  latestReadTimestamp: 0,
  firstUnreadDropSerialNo: null,
  firstUnreadFollowedSubwaveDropSerialNo: null,
  waveRep: null,
  waveScore: null,
  sidebarSection: "highly-rated",
  sidebarActivityTimestamp: null,
  isFollowedSubwaveContainer: false,
};

export const useActiveWaveVotes = () => ({
  data: {
    pages: [
      {
        count: 12,
        data: Array.from({ length: 12 }, (_, index) => ({
          wave: {
            id: `fixture-vote-${index}`,
            name: `Synthetic vote ${index}`,
            pfp: null,
          },
          voting_ends_at: null,
          next_decision_at: null,
        })),
      },
    ],
  },
  isPending: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
});
export const useMyStream = () => ({
  activeWave: { id: null, set: () => undefined },
});
export const useWaveDiscoveryViewer = () => ({ canUseCollections: false });
const ContentTabsContext = createContext(tabs);
export const useContentTab = () => ({
  availableTabs: useContext(ContentTabsContext),
});

function Fixture() {
  const [consent, setConsent] = useState(false);
  const [instance, setInstance] = useState(0);
  const [tab, setTab] = useState(MyStreamWaveTab.CHAT);
  const [sort, setSort] = useState(WaveDropsLeaderboardSort.RANK);
  const [collection, setCollection] = useState<"all" | "pinned" | "joined">(
    "all"
  );
  const [queryText, setQueryText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recommendationActive, setRecommendationActive] = useState(true);
  const [availableTabs, setAvailableTabs] = useState(() =>
    new URLSearchParams(location.search).has("late-tabs")
      ? [MyStreamWaveTab.CHAT]
      : tabs
  );
  const navigation = {
    collection,
    setCollection,
    canUseCollections: true,
    searchOpen: searchOpen || queryText.trim().length > 0,
    setSearchOpen,
    searching: queryText.trim().length > 0,
    queryEnabled: queryText.trim().length >= 3,
    queryText,
    setQueryText,
    results: { isFetching: false },
  } as unknown as SidebarWaveNavigation;
  const enable = () => {
    document.cookie = "performance-cookies-consent=true; path=/";
    initAnalytics();
    identify("529");
    mixpanel.register({
      raw_path: "/private-handle?wallet=private-wallet",
      profile_handle: "private-handle",
    });
    setConsent(true);
  };
  window.featureFixture = {
    ...queueFixture,
    showTabs: () =>
      setAvailableTabs([MyStreamWaveTab.CHAT, MyStreamWaveTab.ABOUT]),
    logout: clearIdentity,
    switchProfile: identify,
    resumeAnalytics: () => {
      initAnalytics();
    },
    failIdentityOnce: () => {
      const original = mixpanel.identify.bind(mixpanel);
      mixpanel.identify = () => {
        mixpanel.identify = original;
        throw new Error("Synthetic identity failure");
      };
    },
    failResetTwice: () => {
      const original = mixpanel.reset.bind(mixpanel);
      let attempts = 0;
      mixpanel.reset = () => {
        attempts += 1;
        if (attempts <= 2) throw new Error("Synthetic reset failure");
        mixpanel.reset = original;
        original();
      };
    },
    failSeenOnce: (value) => {
      const original = mixpanel.track.bind(mixpanel);
      mixpanel.track = (...args) => {
        const [eventName, properties] = args;
        if (
          eventName === "Wave Feature Seen" &&
          properties?.["value"] === value
        ) {
          mixpanel.track = original;
          throw new Error("Synthetic Seen failure");
        }
        return original(...args);
      };
    },
    updateTraits: () => identify("529", { fixture_trait: "allowed" }),
    resetVisit: () => {
      resetWaveFeatureVisit();
    },
    enable,
    revoke: () => {
      document.cookie = "performance-cookies-consent=false; path=/";
      disableAnalytics();
      setConsent(false);
    },
    remount: () => setInstance((value) => value + 1),
    navigate: (path) => {
      history.pushState({}, "", path);
      setInstance((value) => value + 1);
    },
    lateEvent: () =>
      trackAnalyticsEvent("Wave Feature Activated", {
        feature: "wave_tab",
        value: "chat",
      }),
    failSdk: () => {
      mixpanel.track = () => {
        throw new Error("Synthetic SDK failure");
      };
    },
  };
  return (
    <ConsentContext.Provider value={{ performanceConsent: consent }}>
      <button type="button" onClick={enable}>
        Enable synthetic telemetry
      </button>
      <main key={instance}>
        <SidebarWaveNavigationControls navigation={navigation} />
        <WebProfileFeedShortcut basePath="/waves" isCollapsed={false} />
        <div
          id="nested-scroll"
          style={{ height: 220, width: 300, overflow: "auto" }}
        >
          <SidebarDiscovery
            previewItems={
              new URLSearchParams(location.search).has("recommendations")
                ? [
                    {
                      wave: recommendationWave,
                      href: "/waves/private-recommendation",
                      isActive: recommendationActive,
                      onClick: (event) => {
                        event.preventDefault();
                        setRecommendationActive((active) => !active);
                      },
                    },
                  ]
                : []
            }
            isTouchPreview={false}
          />
        </div>
        <ContentTabsContext.Provider value={availableTabs}>
          <MyStreamWaveDesktopTabs
            wave={wave}
            activeTab={tab}
            setActiveTab={setTab}
            activeCurationId={null}
            onSelectCuration={() => undefined}
            showCreateActionsMenu={false}
          />
        </ContentTabsContext.Provider>
        <div id="sort-controls">
          <WaveleaderboardSort
            sort={sort}
            onSortChange={setSort}
            mode={
              window.innerWidth < 640 ||
              new URLSearchParams(location.search).has("dropdown")
                ? "dropdown"
                : "tabs"
            }
            telemetryScope={wave.id}
          />
        </div>
        <output aria-label="Selected fixture state">
          {tab}:{sort}
        </output>
      </main>
    </ConsentContext.Provider>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Fixture />);
