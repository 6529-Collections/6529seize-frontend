import { renderHook } from "@testing-library/react";
import React from "react";
import useWavesList from "@/hooks/useWavesList";
import { AuthContext } from "@/components/auth/Auth";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveById } from "@/hooks/useWaveById";

jest.mock("@/hooks/useWavesOverview", () => ({
  useWavesOverview: jest.fn(),
}));

jest.mock("@/hooks/usePinnedWavesServer", () => ({
  usePinnedWavesServer: jest.fn(),
}));

jest.mock("@/hooks/useWaveById", () => ({
  useWaveById: jest.fn(),
}));

jest.mock("@/hooks/useShowFollowingWaves", () => ({
  useShowFollowingWaves: jest.fn(() => [false]),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

const useWavesOverviewMock = require("@/hooks/useWavesOverview")
  .useWavesOverview as jest.Mock;
const usePinnedWavesServerMock = require("@/hooks/usePinnedWavesServer")
  .usePinnedWavesServer as jest.Mock;
const useSeizeSettingsMock = require("@/contexts/SeizeSettingsContext")
  .useSeizeSettings as jest.Mock;
const useWaveByIdMock = useWaveById as jest.Mock;

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider
    value={
      { connectedProfile: { handle: "me" }, activeProfileProxy: null } as any
    }
  >
    {children}
  </AuthContext.Provider>
);

const dmWave = {
  id: "1",
  created_at: 0,
  metrics: { latest_drop_timestamp: 50 },
  wave: { type: ApiWaveType.Chat },
  chat: { scope: { group: { is_direct_message: true } } },
} as any;
const mainWave = {
  id: "2",
  created_at: 1,
  metrics: { latest_drop_timestamp: 100 },
  wave: { type: ApiWaveType.Rank },
} as any;
const pinnedExtra = {
  id: "3",
  created_at: 2,
  metrics: { latest_drop_timestamp: 200 },
  wave: { type: ApiWaveType.Rank },
} as any;
const announcementWave = {
  id: "4",
  created_at: 3,
  metrics: { latest_drop_timestamp: 300 },
  wave: { type: ApiWaveType.Rank },
} as any;
let announcementRefetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  announcementRefetchMock = jest.fn();
  useWavesOverviewMock.mockReturnValue({
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
});

test("combines main and pinned waves, filtering DMs and flagging pinned", () => {
  const { result } = renderHook(() => useWavesList(), { wrapper });
  const waves = result.current.waves;
  expect(waves.map((w: any) => w.id)).toEqual(["3", "2"]);
  expect(waves.every((w: any) => w.isPinned)).toBe(true);
  expect(result.current.pinnedWaves.map((w: any) => w.id)).toEqual(["3"]);
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
    wave: announcementWave,
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

  useWavesOverviewMock.mockReturnValue({
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
