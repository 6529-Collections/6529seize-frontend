import { act, renderHook } from "@testing-library/react";
import React from "react";
import useWavesList from "@/hooks/useWavesList";
import { AuthContext } from "@/components/auth/Auth";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveById } from "@/hooks/useWaveById";
import { SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS } from "@/components/react-query-wrapper/utils/query-utils";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/hooks/useWavesV2", () => {
  const actual = jest.requireActual("@/hooks/useWavesV2");
  return {
    ...actual,
    useWavesV2: jest.fn(),
  };
});

jest.mock("@/hooks/usePinnedWavesServer", () => ({
  usePinnedWavesServer: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/hooks/useWaveById", () => ({
  useWaveById: jest.fn(),
}));

jest.mock("@/hooks/useShowFollowingWaves", () => ({
  useShowFollowingWaves: jest.fn(() => [false]),
}));

jest.mock("@/hooks/useWaveSubwaves", () => ({
  useWaveSubwavesMap: jest.fn(),
  getWaveSubwavesQueryOptions: jest.fn(
    (parentWaveId: string, viewerIdentityKey?: string | null) => ({
      queryKey: [
        "WAVE_SUBWAVES",
        {
          parent_wave_id: parentWaveId,
          ...(viewerIdentityKey ? { viewer_identity: viewerIdentityKey } : {}),
        },
      ],
      queryFn: jest.fn().mockResolvedValue([]),
      staleTime: 60_000,
    })
  ),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

const useWavesV2Mock = require("@/hooks/useWavesV2").useWavesV2 as jest.Mock;
const usePinnedWavesServerMock = require("@/hooks/usePinnedWavesServer")
  .usePinnedWavesServer as jest.Mock;
const useSeizeConnectContextMock =
  require("@/components/auth/SeizeConnectContext")
    .useSeizeConnectContext as jest.Mock;
const useSeizeSettingsMock = require("@/contexts/SeizeSettingsContext")
  .useSeizeSettings as jest.Mock;
const useWaveByIdMock = useWaveById as jest.Mock;
const useShowFollowingWavesMock = require("@/hooks/useShowFollowingWaves")
  .useShowFollowingWaves as jest.Mock;
const useWaveSubwavesMapMock = require("@/hooks/useWaveSubwaves")
  .useWaveSubwavesMap as jest.Mock;
const getWaveSubwavesQueryOptionsMock = require("@/hooks/useWaveSubwaves")
  .getWaveSubwavesQueryOptions as jest.Mock;

let queryClient: QueryClient;

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthContext.Provider
      value={
        { connectedProfile: { handle: "me" }, activeProfileProxy: null } as any
      }
    >
      {children}
    </AuthContext.Provider>
  </QueryClientProvider>
);

const wrapperWithoutConnectedIdentity: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthContext.Provider
      value={{ connectedProfile: null, activeProfileProxy: null } as any}
    >
      {children}
    </AuthContext.Provider>
  </QueryClientProvider>
);

const createSidebarWave = ({
  id,
  latestDropTimestamp,
  isDirectMessage = false,
  type = ApiWaveType.Rank,
  pinned = false,
  subscribed = false,
}: {
  readonly id: string;
  readonly latestDropTimestamp: number;
  readonly isDirectMessage?: boolean;
  readonly type?: ApiWaveType;
  readonly pinned?: boolean;
  readonly subscribed?: boolean;
}) => ({
  id,
  name: id,
  type,
  createdAt: 0,
  picture: null,
  contributors: [],
  isDirectMessage,
  hasCompetition: type !== ApiWaveType.Chat,
  parentWaveId: null,
  hasSubwaves: false,
  descriptionDrop: {
    contents: null,
    media: [],
  },
  totalDropsCount: 0,
  isPrivate: false,
  latestDropTimestamp,
  firstUnreadDropSerialNo: null,
  unreadDropsCount: 0,
  latestReadTimestamp: 0,
  pinned,
  muted: false,
  subscribed,
});

const createLegacyApiWave = (id: string, latestDropTimestamp: number) =>
  ({
    id,
    name: id,
    created_at: 0,
    picture: null,
    contributors_overview: [],
    metrics: {
      drops_count: 0,
      latest_drop_timestamp: latestDropTimestamp,
      first_unread_drop_serial_no: null,
      your_unread_drops_count: 0,
      your_latest_read_timestamp: 0,
      muted: false,
    },
    wave: { type: ApiWaveType.Rank },
    parent_wave: null,
    has_subwaves: false,
    chat: { scope: { group: { is_direct_message: false } } },
    visibility: { scope: { group: null } },
    description_drop: { parts: [] },
    pinned: false,
    subscribed_actions: [],
  }) as any;

const dmWave = createSidebarWave({
  id: "1",
  latestDropTimestamp: 50,
  isDirectMessage: true,
  type: ApiWaveType.Chat,
});
const mainWave = createSidebarWave({ id: "2", latestDropTimestamp: 100 });
const pinnedExtra = createSidebarWave({ id: "3", latestDropTimestamp: 200 });
const announcementWave = createSidebarWave({
  id: "4",
  latestDropTimestamp: 300,
});
const legacyAnnouncementWave = createLegacyApiWave("4", 300);
let announcementRefetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  announcementRefetchMock = jest.fn();
  useShowFollowingWavesMock.mockReturnValue([false]);
  useSeizeConnectContextMock.mockReturnValue({ address: "0xABC" });
  useWavesV2Mock.mockReturnValue({
    waves: [dmWave, mainWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  });
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: ["2", "3"],
    pinnedWaves: [pinnedExtra],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  useSeizeSettingsMock.mockReturnValue({
    seizeSettings: {
      announcements_wave_id: null,
    },
    isAnnouncementsWave: () => false,
  });
  useWaveByIdMock.mockReturnValue({
    wave: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: announcementRefetchMock,
    isFetching: false,
  });
  useWaveSubwavesMapMock.mockReturnValue({
    subwaves: [],
    subwavesByParentId: new Map(),
    isFetching: false,
    refetch: jest.fn(),
  });
});

test("combines main and pinned waves, filtering DMs and flagging pinned", () => {
  const { result } = renderHook(() => useWavesList(), { wrapper });
  const waves = result.current.waves;
  expect(waves.map((w: any) => w.id)).toEqual(["3", "2"]);
  expect(waves.every((w: any) => w.isPinned)).toBe(true);
  expect(result.current.pinnedWaves.map((w: any) => w.id)).toEqual(["3"]);
  const waveQueryArgs = useWavesV2Mock.mock.calls.map(([args]) => args);
  expect(waveQueryArgs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
        pageSize: 10,
        directMessage: false,
        excludeFollowed: true,
        pinned: ApiWavesPinFilter.NotPinned,
        scoreSort: ApiWaveScoreSort.Quality,
        enabled: true,
        refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
        refetchIntervalInBackground: false,
      }),
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
        pageSize: 20,
        directMessage: false,
        excludeFollowed: true,
        pinned: ApiWavesPinFilter.NotPinned,
        scoreSort: ApiWaveScoreSort.Quality,
        enabled: true,
        refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
        refetchIntervalInBackground: false,
      }),
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
        pageSize: 20,
        following: true,
        directMessage: false,
        enabled: true,
        refetchInterval: false,
        refetchIntervalInBackground: false,
      }),
    ])
  );
  expect(
    waveQueryArgs.find(
      (args) => args.overviewType === ApiWavesOverviewType.RecentlyDroppedTo
    )
  ).not.toHaveProperty("scoreSort");
});

test("polls followed activity when the sidebar is in joined mode", () => {
  useShowFollowingWavesMock.mockReturnValue([true]);

  renderHook(() => useWavesList(), { wrapper });

  const waveQueryArgs = useWavesV2Mock.mock.calls.map(([args]) => args);
  expect(
    waveQueryArgs.filter(
      (args) =>
        args.overviewType === ApiWavesOverviewType.ScoredRecentlyDroppedTo
    )
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        pageSize: 10,
        enabled: false,
        excludeFollowed: true,
        pinned: ApiWavesPinFilter.NotPinned,
        scoreSort: ApiWaveScoreSort.Quality,
        refetchInterval: false,
      }),
      expect.objectContaining({
        pageSize: 20,
        enabled: false,
        excludeFollowed: true,
        pinned: ApiWavesPinFilter.NotPinned,
        scoreSort: ApiWaveScoreSort.Quality,
        refetchInterval: false,
      }),
    ])
  );
  expect(
    waveQueryArgs.find(
      (args) => args.overviewType === ApiWavesOverviewType.RecentlyDroppedTo
    )
  ).toMatchObject({
    enabled: true,
    refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
  });
});

test("falls back to all waves when joined preference is persisted without a connected identity", () => {
  useShowFollowingWavesMock.mockReturnValue([true]);

  const highlyRatedWave = createSidebarWave({
    id: "highly-rated",
    latestDropTimestamp: 50,
  });
  const allQualityWave = createSidebarWave({
    id: "all-quality",
    latestDropTimestamp: 100,
  });

  useWavesV2Mock.mockImplementation(({ enabled, overviewType, pageSize }) => {
    let waves = [allQualityWave];
    if (enabled === false) {
      waves = [];
    } else if (
      overviewType === ApiWavesOverviewType.ScoredRecentlyDroppedTo &&
      pageSize === 10
    ) {
      waves = [highlyRatedWave];
    }

    return {
      waves,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      refetch: jest.fn(),
    };
  });
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: [],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => useWavesList(), {
    wrapper: wrapperWithoutConnectedIdentity,
  });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "highly-rated",
    "all-quality",
  ]);
  expect(useWavesV2Mock.mock.calls.map(([args]) => args)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
        pageSize: 10,
        enabled: true,
      }),
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
        pageSize: 20,
        enabled: true,
      }),
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
        enabled: false,
      }),
    ])
  );
});

test("shows only followed waves in joined mode", () => {
  useShowFollowingWavesMock.mockReturnValue([true]);

  const followedOld = createSidebarWave({
    id: "followed-old",
    latestDropTimestamp: 10,
    subscribed: true,
  });
  const followedNew = createSidebarWave({
    id: "followed-new",
    latestDropTimestamp: 500,
    subscribed: true,
  });
  const highlyRatedOne = createSidebarWave({
    id: "highly-rated-one",
    latestDropTimestamp: 50,
  });
  const highlyRatedTwo = createSidebarWave({
    id: "highly-rated-two",
    latestDropTimestamp: 60,
  });
  const highlyRatedThree = createSidebarWave({
    id: "highly-rated-three",
    latestDropTimestamp: 70,
  });
  const highlyRatedFour = createSidebarWave({
    id: "highly-rated-four",
    latestDropTimestamp: 80,
  });
  const allQualityWave = createSidebarWave({
    id: "all-quality",
    latestDropTimestamp: 999,
  });
  const fetchNextAllQualityPage = jest.fn();
  const fetchNextFollowedActivityPage = jest.fn();

  useWavesV2Mock.mockImplementation(({ overviewType, pageSize }) => ({
    waves:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? [followedOld, followedNew]
        : pageSize === 10
          ? [
              highlyRatedOne,
              highlyRatedTwo,
              highlyRatedThree,
              highlyRatedFour,
            ]
          : [
              highlyRatedOne,
              highlyRatedTwo,
              highlyRatedThree,
              highlyRatedFour,
              allQualityWave,
            ],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    fetchNextPage:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? fetchNextFollowedActivityPage
        : pageSize === 20
          ? fetchNextAllQualityPage
          : jest.fn(),
    status: "success",
    refetch: jest.fn(),
  }));
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: ["3"],
    pinnedWaves: [pinnedExtra],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "followed-new",
    "followed-old",
  ]);
  expect(
    result.current.waves
      .filter(
        (wave: any) =>
          !wave.isPinned &&
          !wave.subscribed &&
          wave.sidebarSection === "highly-rated"
      )
      .map((wave: any) => wave.id)
  ).toEqual([]);
  expect(
    result.current.waves
      .filter(
        (wave: any) =>
          !wave.isPinned && !wave.subscribed && wave.sidebarSection === "all"
      )
      .map((wave: any) => wave.id)
  ).toEqual([]);

  result.current.fetchNextPage();

  expect(fetchNextAllQualityPage).not.toHaveBeenCalled();
  expect(fetchNextFollowedActivityPage).toHaveBeenCalled();
});

test("paginates only followed activity in joined mode", () => {
  useShowFollowingWavesMock.mockReturnValue([true]);

  const followedWave = createSidebarWave({
    id: "followed",
    latestDropTimestamp: 500,
    subscribed: true,
  });
  const fetchNextAllQualityPage = jest.fn();
  const fetchNextFollowedActivityPage = jest.fn();

  useWavesV2Mock.mockImplementation(({ overviewType, pageSize }) => ({
    waves:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? [followedWave]
        : [],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo ||
      pageSize === 20,
    fetchNextPage:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? fetchNextFollowedActivityPage
        : pageSize === 20
          ? fetchNextAllQualityPage
          : jest.fn(),
    status: "success",
    refetch: jest.fn(),
  }));
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: [],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "followed",
  ]);
  expect(result.current.hasNextPage).toBe(true);

  result.current.fetchNextPage();

  expect(fetchNextFollowedActivityPage).toHaveBeenCalled();
  expect(fetchNextAllQualityPage).not.toHaveBeenCalled();
});

test("excludes unjoined pinned, announcement, and subwaves in joined mode", () => {
  useShowFollowingWavesMock.mockReturnValue([true]);

  const joinedPinnedWave = createSidebarWave({
    id: "joined-pinned",
    latestDropTimestamp: 600,
    pinned: true,
    subscribed: true,
  });
  const unjoinedPinnedWave = createSidebarWave({
    id: "unjoined-pinned",
    latestDropTimestamp: 700,
    pinned: true,
    subscribed: false,
  });
  const joinedParentWave = {
    ...createSidebarWave({
      id: "joined-parent",
      latestDropTimestamp: 500,
      subscribed: true,
    }),
    hasSubwaves: true,
  };
  const joinedSubwave = {
    ...createSidebarWave({
      id: "joined-subwave",
      latestDropTimestamp: 300,
      subscribed: true,
    }),
    parentWaveId: "joined-parent",
  };
  const unjoinedSubwave = {
    ...createSidebarWave({
      id: "unjoined-subwave",
      latestDropTimestamp: 400,
      subscribed: false,
    }),
    parentWaveId: "joined-parent",
  };

  useWavesV2Mock.mockImplementation(({ overviewType }) => ({
    waves:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? [joinedParentWave, announcementWave]
        : [],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  }));
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: ["joined-pinned", "unjoined-pinned"],
    pinnedWaves: [joinedPinnedWave, unjoinedPinnedWave],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  useSeizeSettingsMock.mockReturnValue({
    seizeSettings: {
      announcements_wave_id: "4",
    },
    isAnnouncementsWave: (waveId: string | null | undefined) => waveId === "4",
  });
  useWaveSubwavesMapMock.mockImplementation(
    ({ parentWaveIds }: { readonly parentWaveIds: readonly string[] }) => ({
      subwaves: parentWaveIds.includes("joined-parent")
        ? [joinedSubwave, unjoinedSubwave]
        : [],
      subwavesByParentId: new Map(
        parentWaveIds.includes("joined-parent")
          ? [
              [
                "joined-parent",
                {
                  subwaves: [joinedSubwave, unjoinedSubwave],
                  isFetching: false,
                },
              ],
            ]
          : []
      ),
      isFetching: false,
      refetch: jest.fn(),
    })
  );

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "joined-pinned",
    "joined-parent",
  ]);

  act(() => {
    result.current.loadSubwavesForParent("joined-parent");
  });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "joined-pinned",
    "joined-parent",
    "joined-subwave",
  ]);
});

test("puts highly rated discovery before followed activity", () => {
  const followedOld = createSidebarWave({
    id: "followed-old",
    latestDropTimestamp: 10,
    subscribed: true,
  });
  const followedNew = createSidebarWave({
    id: "followed-new",
    latestDropTimestamp: 500,
    subscribed: true,
  });
  const scoreSuggestion = createSidebarWave({
    id: "score-suggestion",
    latestDropTimestamp: 999,
  });

  useWavesV2Mock.mockImplementation(({ overviewType, pageSize }) => ({
    waves:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? [followedOld, followedNew]
        : pageSize === 10
          ? [scoreSuggestion]
          : [scoreSuggestion, followedOld],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  }));
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: [],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "score-suggestion",
    "followed-new",
    "followed-old",
  ]);
});

test("preserves backend order for regular scored waves", () => {
  const firstRegularWave = createSidebarWave({
    id: "first",
    latestDropTimestamp: 10,
  });
  const secondRegularWave = createSidebarWave({
    id: "second",
    latestDropTimestamp: 999,
  });

  useWavesV2Mock.mockImplementation(({ overviewType }) => ({
    waves:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? []
        : [firstRegularWave, secondRegularWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  }));
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: [],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "first",
    "second",
  ]);
});

test("documents root-wave sources by ignoring malformed subwave cache entries", () => {
  const malformedPinnedSubwave = {
    ...createSidebarWave({ id: "subwave", latestDropTimestamp: 400 }),
    parentWaveId: "parent",
  };

  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: ["subwave", "2"],
    pinnedWaves: [malformedPinnedSubwave],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual(["2"]);
  expect(result.current.pinnedWaves).toEqual([]);
});

test("starts without subwave queries, then appends subwaves for loaded parents", () => {
  const parentWave = {
    ...createSidebarWave({ id: "parent", latestDropTimestamp: 500 }),
    hasSubwaves: true,
  };
  const childWave = {
    ...createSidebarWave({ id: "child", latestDropTimestamp: 300 }),
    parentWaveId: "parent",
  };

  useWavesV2Mock.mockReturnValue({
    waves: [parentWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  });
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: [],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  useWaveSubwavesMapMock.mockImplementation(
    ({ parentWaveIds }: { readonly parentWaveIds: readonly string[] }) => ({
      subwaves: parentWaveIds.includes("parent") ? [childWave] : [],
      subwavesByParentId: new Map(
        parentWaveIds.includes("parent")
          ? [["parent", { subwaves: [childWave], isFetching: false }]]
          : []
      ),
      isFetching: false,
      refetch: jest.fn(),
    })
  );

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(useWaveSubwavesMapMock).toHaveBeenLastCalledWith({
    parentWaveIds: [],
    viewerIdentityKey: "0xabc:primary",
  });
  expect(result.current.waves.map((wave: any) => wave.id)).toEqual(["parent"]);

  act(() => {
    result.current.loadSubwavesForParent("parent");
    result.current.loadSubwavesForParent("parent");
  });

  expect(useWaveSubwavesMapMock).toHaveBeenLastCalledWith({
    parentWaveIds: ["parent"],
    viewerIdentityKey: "0xabc:primary",
  });
  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "parent",
    "child",
  ]);
});

test("exposes loading parent ids while requested subwaves are fetching", () => {
  const parentWave = {
    ...createSidebarWave({ id: "parent", latestDropTimestamp: 500 }),
    hasSubwaves: true,
  };

  useWavesV2Mock.mockReturnValue({
    waves: [parentWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  });
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: [],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  useWaveSubwavesMapMock.mockImplementation(
    ({ parentWaveIds }: { readonly parentWaveIds: readonly string[] }) => ({
      subwaves: [],
      subwavesByParentId: new Map(
        parentWaveIds.includes("parent")
          ? [["parent", { subwaves: [], isFetching: true }]]
          : []
      ),
      isFetching: parentWaveIds.includes("parent"),
      refetch: jest.fn(),
    })
  );

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.loadingSubwaveParentIds).toEqual([]);

  act(() => {
    result.current.loadSubwavesForParent("parent");
  });

  expect(result.current.loadingSubwaveParentIds).toEqual(["parent"]);
});

test("keeps public fetching state scoped to root wave sources", () => {
  useWaveSubwavesMapMock.mockReturnValue({
    subwaves: [],
    subwavesByParentId: new Map(),
    isFetching: true,
    refetch: jest.fn(),
  });

  const { result, rerender } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.isFetching).toBe(false);

  useWavesV2Mock.mockReturnValue({
    waves: [mainWave],
    isFetching: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  });
  useWaveSubwavesMapMock.mockReturnValue({
    subwaves: [],
    subwavesByParentId: new Map(),
    isFetching: false,
    refetch: jest.fn(),
  });

  rerender();

  expect(result.current.isFetching).toBe(true);
});

test("prefetches subwaves without adding parent ids to rendered rows", () => {
  const parentWave = {
    ...createSidebarWave({ id: "parent", latestDropTimestamp: 500 }),
    hasSubwaves: true,
  };
  const prefetchSpy = jest.spyOn(queryClient, "prefetchQuery");

  useWavesV2Mock.mockReturnValue({
    waves: [parentWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  });
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: [],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  act(() => {
    result.current.prefetchSubwavesForParent("parent");
  });

  expect(getWaveSubwavesQueryOptionsMock).toHaveBeenCalledWith(
    "parent",
    "0xabc:primary"
  );
  expect(prefetchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      queryKey: [
        "WAVE_SUBWAVES",
        {
          parent_wave_id: "parent",
          viewer_identity: "0xabc:primary",
        },
      ],
    })
  );
  expect(useWaveSubwavesMapMock).toHaveBeenLastCalledWith({
    parentWaveIds: [],
    viewerIdentityKey: "0xabc:primary",
  });
  expect(result.current.waves.map((wave: any) => wave.id)).toEqual(["parent"]);
});

test("places highly rated waves below announcements and before known-wave sections", () => {
  const highlyRatedWave = createSidebarWave({
    id: "highly-rated",
    latestDropTimestamp: 50,
  });
  const followedWave = createSidebarWave({
    id: "following",
    latestDropTimestamp: 500,
    subscribed: true,
  });
  const allQualityWave = createSidebarWave({
    id: "all-quality",
    latestDropTimestamp: 400,
  });

  useWavesV2Mock.mockImplementation(({ overviewType, pageSize }) => ({
    waves:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? [followedWave]
        : pageSize === 10
          ? [highlyRatedWave]
          : [announcementWave, allQualityWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  }));
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: ["3"],
    pinnedWaves: [pinnedExtra],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  useSeizeSettingsMock.mockReturnValue({
    seizeSettings: {
      announcements_wave_id: "4",
    },
    isAnnouncementsWave: (waveId: string | null | undefined) => waveId === "4",
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "4",
    "highly-rated",
    "3",
    "following",
    "all-quality",
  ]);
  expect(
    result.current.waves.find((wave: any) => wave.id === "highly-rated")
  ).toMatchObject({
    isPinned: false,
    sidebarSection: "highly-rated",
    subscribed: false,
  });
  expect(result.current.pinnedWaves.map((wave: any) => wave.id)).toEqual(["3"]);
});

test("refetches discovery, activity, pinned, and subwave sources", () => {
  const highlyRatedRefetch = jest.fn();
  const allQualityRefetch = jest.fn();
  const followedActivityRefetch = jest.fn();
  const pinnedRefetch = jest.fn();
  const subwavesRefetch = jest.fn();
  useWavesV2Mock.mockImplementation(({ overviewType, pageSize }) => ({
    waves: [mainWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch:
      overviewType === ApiWavesOverviewType.RecentlyDroppedTo
        ? followedActivityRefetch
        : pageSize === 10
          ? highlyRatedRefetch
          : allQualityRefetch,
  }));
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: [],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: pinnedRefetch,
  });
  useWaveSubwavesMapMock.mockReturnValue({
    subwaves: [],
    subwavesByParentId: new Map(),
    isFetching: false,
    refetch: subwavesRefetch,
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  result.current.refetchAllWaves();

  expect(highlyRatedRefetch).toHaveBeenCalled();
  expect(allQualityRefetch).toHaveBeenCalled();
  expect(followedActivityRefetch).toHaveBeenCalled();
  expect(pinnedRefetch).toHaveBeenCalled();
  expect(subwavesRefetch).toHaveBeenCalled();
});

test("injects the announcement wave once and excludes it from pinned metadata", () => {
  const fallbackAnnouncementRefetch = jest.fn();

  useSeizeSettingsMock.mockReturnValue({
    seizeSettings: {
      announcements_wave_id: "4",
    },
    isAnnouncementsWave: (waveId: string | null | undefined) => waveId === "4",
  });
  useWaveByIdMock.mockReturnValue({
    wave: legacyAnnouncementWave,
    isLoading: false,
    isError: false,
    error: null,
    refetch: fallbackAnnouncementRefetch,
    isFetching: false,
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "4",
    "3",
    "2",
  ]);
  expect(
    result.current.waves.find((wave: any) => wave.id === "4")
  ).toMatchObject({
    id: "4",
    isPinned: false,
  });
  expect(result.current.announcementWave).toMatchObject({ id: "4" });
  expect(result.current.trackedAnnouncementWave).toBeNull();
  expect(result.current.announcementQueryLoading).toBe(false);
  expect(result.current.announcementQueryError).toBeNull();
  expect(result.current.announcementRefetch).toBe(fallbackAnnouncementRefetch);
  expect(
    Object.prototype.hasOwnProperty.call(
      result.current.waves.find((wave: any) => wave.id === "4"),
      "isAnnouncement"
    )
  ).toBe(false);
  expect(result.current.pinnedWaves.map((wave: any) => wave.id)).toEqual(["3"]);
  expect(useWaveByIdMock).toHaveBeenCalledWith("4", { enabled: true });
});

test("preserves pin state for a legacy pinned announcement wave", () => {
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: ["2", "3", "4"],
    pinnedWaves: [pinnedExtra, announcementWave],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  useSeizeSettingsMock.mockReturnValue({
    seizeSettings: {
      announcements_wave_id: "4",
    },
    isAnnouncementsWave: (waveId: string | null | undefined) => waveId === "4",
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(
    result.current.waves.find((wave: any) => wave.id === "4")
  ).toMatchObject({
    id: "4",
    isPinned: true,
  });
  expect(result.current.trackedAnnouncementWave).toMatchObject({ id: "4" });
  expect(result.current.announcementWave).toMatchObject({ id: "4" });
  expect(result.current.announcementQueryLoading).toBe(false);
  expect(result.current.announcementQueryError).toBeNull();
  expect(result.current.announcementRefetch).toBe(announcementRefetchMock);
  expect(result.current.pinnedWaves.map((wave: any) => wave.id)).toEqual(["3"]);
  expect(useWaveByIdMock).toHaveBeenCalledWith("4", { enabled: false });
});

test("reuses an overview announcement wave without enabling the fallback fetch", () => {
  const staleAnnouncementQueryError = new Error(
    "Stale cached announcement query error"
  );

  useWavesV2Mock.mockReturnValue({
    waves: [announcementWave, mainWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  });
  useSeizeSettingsMock.mockReturnValue({
    seizeSettings: {
      announcements_wave_id: " 4 ",
    },
    isAnnouncementsWave: (waveId: string | null | undefined) => waveId === "4",
  });
  useWaveByIdMock.mockReturnValue({
    wave: null,
    isLoading: true,
    isError: true,
    error: staleAnnouncementQueryError,
    refetch: announcementRefetchMock,
    isFetching: false,
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(
    result.current.waves.find((wave: any) => wave.id === "4")
  ).toMatchObject({
    id: "4",
  });
  expect(result.current.trackedAnnouncementWave).toMatchObject({ id: "4" });
  expect(result.current.announcementWave).toMatchObject({ id: "4" });
  expect(result.current.announcementQueryLoading).toBe(false);
  expect(result.current.announcementQueryError).toBeNull();
  expect(result.current.announcementRefetch).toBe(announcementRefetchMock);
  expect(useWaveByIdMock).toHaveBeenCalledWith("4", { enabled: false });
});

test("exposes fallback announcement query loading state when unresolved", () => {
  const loadingAnnouncementRefetch = jest.fn();

  useSeizeSettingsMock.mockReturnValue({
    seizeSettings: {
      announcements_wave_id: "4",
    },
    isAnnouncementsWave: (waveId: string | null | undefined) => waveId === "4",
  });
  useWaveByIdMock.mockReturnValue({
    wave: null,
    isLoading: true,
    isError: false,
    error: null,
    refetch: loadingAnnouncementRefetch,
    isFetching: true,
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.announcementWave).toBeNull();
  expect(result.current.trackedAnnouncementWave).toBeNull();
  expect(result.current.announcementQueryLoading).toBe(true);
  expect(result.current.announcementQueryError).toBeNull();
  expect(result.current.announcementRefetch).toBe(loadingAnnouncementRefetch);
  expect(useWaveByIdMock).toHaveBeenCalledWith("4", { enabled: true });
});

test("exposes fallback announcement query error when unresolved", () => {
  const failedAnnouncementRefetch = jest.fn();
  const announcementQueryError = new Error("Failed to load announcement wave");

  useSeizeSettingsMock.mockReturnValue({
    seizeSettings: {
      announcements_wave_id: "4",
    },
    isAnnouncementsWave: (waveId: string | null | undefined) => waveId === "4",
  });
  useWaveByIdMock.mockReturnValue({
    wave: null,
    isLoading: false,
    isError: true,
    error: announcementQueryError,
    refetch: failedAnnouncementRefetch,
    isFetching: false,
  });

  const { result } = renderHook(() => useWavesList(), { wrapper });

  expect(result.current.announcementWave).toBeNull();
  expect(result.current.trackedAnnouncementWave).toBeNull();
  expect(result.current.announcementQueryLoading).toBe(false);
  expect(result.current.announcementQueryError).toBe(announcementQueryError);
  expect(result.current.announcementRefetch).toBe(failedAnnouncementRefetch);
  expect(useWaveByIdMock).toHaveBeenCalledWith("4", { enabled: true });
});

test("indicates loading when pinned wave is still loading", () => {
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: ["2", "3"],
    pinnedWaves: [],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: true,
    isError: false,
    refetch: jest.fn(),
  });
  const { result } = renderHook(() => useWavesList(), { wrapper });
  expect(result.current.isPinnedWavesLoading).toBe(true);
});
