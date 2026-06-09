import { act, renderHook } from "@testing-library/react";
import React from "react";
import useWavesList from "@/hooks/useWavesList";
import { AuthContext } from "@/components/auth/Auth";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveById } from "@/hooks/useWaveById";
import { SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS } from "@/components/react-query-wrapper/utils/query-utils";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
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

jest.mock("@/hooks/useOfficialWaves", () => ({
  useOfficialWaves: jest.fn(),
}));

jest.mock("@/hooks/useWaveSubwaves", () => ({
  useWaveSubwavesMap: jest.fn(),
  getWaveSubwavesQueryOptions: jest.fn((parentWaveId: string) => ({
    queryKey: ["WAVE_SUBWAVES", { parent_wave_id: parentWaveId }],
    queryFn: jest.fn().mockResolvedValue([]),
    staleTime: 60_000,
  })),
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
const useOfficialWavesMock =
  require("@/hooks/useOfficialWaves").useOfficialWaves as jest.Mock;
const useWaveSubwavesMapMock =
  require("@/hooks/useWaveSubwaves").useWaveSubwavesMap as jest.Mock;
const getWaveSubwavesQueryOptionsMock =
  require("@/hooks/useWaveSubwaves").getWaveSubwavesQueryOptions as jest.Mock;

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

const createSidebarWave = ({
  id,
  latestDropTimestamp,
  isDirectMessage = false,
  type = ApiWaveType.Rank,
  pinned = false,
}: {
  readonly id: string;
  readonly latestDropTimestamp: number;
  readonly isDirectMessage?: boolean;
  readonly type?: ApiWaveType;
  readonly pinned?: boolean;
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
  subscribed: false,
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
const officialWave = createSidebarWave({
  id: "5",
  latestDropTimestamp: 250,
});
const pinnedOfficialWave = createSidebarWave({
  id: "6",
  latestDropTimestamp: 350,
});
const stalePinnedOfficialWave = createSidebarWave({
  id: "7",
  latestDropTimestamp: 275,
  pinned: true,
});
const legacyAnnouncementWave = createLegacyApiWave("4", 300);
let announcementRefetchMock: jest.Mock;
let officialWavesRefetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  announcementRefetchMock = jest.fn();
  officialWavesRefetchMock = jest.fn();
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
  useOfficialWavesMock.mockReturnValue({
    waves: [],
    isFetching: false,
    status: "success",
    refetch: officialWavesRefetchMock,
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
  expect(useWavesV2Mock).toHaveBeenCalledWith(
    expect.objectContaining({
      overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
      pageSize: 20,
      directMessage: false,
      refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
      refetchIntervalInBackground: false,
    })
  );
  expect(useOfficialWavesMock).toHaveBeenCalledWith(
    expect.objectContaining({
      viewerIdentityKey: "0xabc:primary",
      refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
      refetchIntervalInBackground: false,
    })
  );
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
  });
  expect(result.current.waves.map((wave: any) => wave.id)).toEqual(["parent"]);

  act(() => {
    result.current.loadSubwavesForParent("parent");
  });

  expect(useWaveSubwavesMapMock).toHaveBeenLastCalledWith({
    parentWaveIds: ["parent"],
  });
  expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
    "parent",
    "child",
  ]);
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

  expect(getWaveSubwavesQueryOptionsMock).toHaveBeenCalledWith("parent");
  expect(prefetchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      queryKey: ["WAVE_SUBWAVES", { parent_wave_id: "parent" }],
    })
  );
  expect(useWaveSubwavesMapMock).toHaveBeenLastCalledWith({
    parentWaveIds: [],
  });
  expect(result.current.waves.map((wave: any) => wave.id)).toEqual(["parent"]);
});

test("places official waves below announcements and ignores stale official pinned flags", () => {
  useWavesV2Mock.mockReturnValue({
    waves: [announcementWave, stalePinnedOfficialWave, officialWave, mainWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: jest.fn(),
  });
  usePinnedWavesServerMock.mockReturnValue({
    pinnedIds: ["2", "3", "5", "6"],
    pinnedWaves: [pinnedExtra, officialWave, pinnedOfficialWave],
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  useOfficialWavesMock.mockReturnValue({
    waves: [officialWave, pinnedOfficialWave, stalePinnedOfficialWave],
    isFetching: false,
    status: "success",
    refetch: officialWavesRefetchMock,
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
    "6",
    "7",
    "5",
    "3",
    "2",
  ]);
  expect(
    result.current.waves
      .filter((wave: any) => wave.isOfficial)
      .map((wave: any) => ({ id: wave.id, isPinned: wave.isPinned }))
  ).toEqual([
    { id: "6", isPinned: true },
    { id: "7", isPinned: false },
    { id: "5", isPinned: true },
  ]);
  expect(result.current.pinnedWaves.map((wave: any) => wave.id)).toEqual(["3"]);
});

test("refetches official waves when refetching all waves", () => {
  const mainWavesRefetch = jest.fn();
  const pinnedRefetch = jest.fn();
  const subwavesRefetch = jest.fn();
  useWavesV2Mock.mockReturnValue({
    waves: [mainWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: "success",
    refetch: mainWavesRefetch,
  });
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

  expect(mainWavesRefetch).toHaveBeenCalled();
  expect(officialWavesRefetchMock).toHaveBeenCalled();
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
