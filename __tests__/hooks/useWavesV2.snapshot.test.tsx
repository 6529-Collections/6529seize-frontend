import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWavesV2 } from "@/hooks/useWavesV2";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import {
  fetchJoinedWavesPage,
  fetchWavesV2Page,
} from "@/services/api/waves-v2-api";
import type { SidebarWave, SidebarWavesPage } from "@/types/waves.types";

jest.mock("@/services/api/waves-v2-api", () => ({
  ...jest.requireActual("@/services/api/waves-v2-api"),
  fetchJoinedWavesPage: jest.fn(),
  fetchWavesV2Page: jest.fn(),
}));

const api = jest.mocked(fetchJoinedWavesPage);
const page = (ids: string[], nextCursor: string | null): SidebarWavesPage => ({
  waves: ids.map((id) => ({ id }) as SidebarWave),
  page: 1,
  next: nextCursor !== null,
  nextCursor,
});
const ids = (prefix: string, start: number, end: number) =>
  Array.from(
    { length: end - start },
    (_, index) => `${prefix}-${index + start}`
  );
const failure = (status: number) =>
  Object.assign(new Error("Could not load waves"), { status });

function setup(viewer = "alice") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 60_000, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: { readonly children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(
    ({ identity }) =>
      useWavesV2({
        overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
        following: true,
        joinedSnapshot: true,
        viewerIdentityKey: identity,
      }),
    { initialProps: { identity: viewer }, wrapper }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

it("follows opaque cursors through more than two pages without using numeric offsets", async () => {
  api.mockImplementation(async ({ cursor }) => {
    if (!cursor) return page(ids("a", 0, 20), "snapshot-a:20");
    if (cursor === "snapshot-a:20")
      return page(ids("a", 20, 40), "snapshot-a:40");
    return page(ids("a", 40, 65), null);
  });
  const { result } = setup();
  await waitFor(() => expect(result.current.waves).toHaveLength(20));
  act(() => result.current.fetchNextPage());
  await waitFor(() => expect(result.current.waves).toHaveLength(40));
  act(() => result.current.fetchNextPage());
  await waitFor(() => expect(result.current.hasNextPage).toBe(false));
  expect(result.current.waves.map((wave) => wave.id)).toEqual(ids("a", 0, 65));
  expect(fetchWavesV2Page).not.toHaveBeenCalled();
  expect(api.mock.calls.map(([request]) => request.cursor)).toEqual([
    undefined,
    "snapshot-a:20",
    "snapshot-a:40",
  ]);
});

it("retains loaded waves on a next-page failure and retries the same cursor", async () => {
  api
    .mockResolvedValueOnce(page(ids("a", 0, 20), "snapshot-a:20"))
    .mockRejectedValueOnce(failure(400))
    .mockResolvedValueOnce(page(ids("a", 20, 40), null));
  const { result } = setup();
  await waitFor(() => expect(result.current.waves).toHaveLength(20));
  act(() => result.current.fetchNextPage());
  await waitFor(() => expect(result.current.hasLoadingError).toBe(true));
  expect(result.current.waves).toHaveLength(20);
  act(() => result.current.retryLoading());
  await waitFor(() => expect(result.current.waves).toHaveLength(40));
  expect(result.current.hasLoadingError).toBe(false);
  expect(api.mock.calls.slice(1).map(([request]) => request.cursor)).toEqual([
    "snapshot-a:20",
    "snapshot-a:20",
  ]);
});

it("replaces an expired multi-page snapshot atomically while keeping old rows visible during recovery", async () => {
  let finishRefresh: (value: SidebarWavesPage) => void = () => undefined;
  const pending = new Promise<SidebarWavesPage>((resolve) => {
    finishRefresh = resolve;
  });
  api
    .mockResolvedValueOnce(page(ids("a", 0, 20), "snapshot-a:20"))
    .mockResolvedValueOnce(page(ids("a", 20, 40), "snapshot-a:40"))
    .mockRejectedValueOnce(failure(410))
    .mockResolvedValueOnce(page(ids("b", 0, 20), "snapshot-b:20"))
    .mockReturnValueOnce(pending);
  const { result } = setup();
  await waitFor(() => expect(result.current.waves).toHaveLength(20));
  act(() => result.current.fetchNextPage());
  await waitFor(() => expect(result.current.waves).toHaveLength(40));
  act(() => result.current.fetchNextPage());
  await waitFor(() => expect(api).toHaveBeenCalledTimes(5));
  expect(result.current.waves.map((wave) => wave.id)).toEqual(ids("a", 0, 40));
  await act(async () => finishRefresh(page(ids("b", 20, 40), null)));
  await waitFor(() =>
    expect(result.current.waves.map((wave) => wave.id)).toEqual(ids("b", 0, 40))
  );
  expect(api.mock.calls.map(([request]) => request.cursor)).toEqual([
    undefined,
    "snapshot-a:20",
    "snapshot-a:40",
    undefined,
    "snapshot-b:20",
  ]);
});

it("does not expose the previous profile's snapshot while a different profile loads", async () => {
  api.mockResolvedValueOnce(page(["alice-only"], null));
  const { result, rerender } = setup();
  await waitFor(() => expect(result.current.waves).toHaveLength(1));
  api.mockReturnValue(new Promise(() => undefined));
  rerender({ identity: "bob" });
  expect(result.current.waves).toEqual([]);
});

it("resumes the requested next page after an expired snapshot refresh", async () => {
  api
    .mockResolvedValueOnce(page(ids("a", 0, 20), "snapshot-a:20"))
    .mockRejectedValueOnce(failure(410))
    .mockResolvedValueOnce(page(ids("b", 0, 20), "snapshot-b:20"))
    .mockResolvedValueOnce(page(ids("b", 20, 40), null));
  const { result } = setup();
  await waitFor(() => expect(result.current.waves).toHaveLength(20));
  act(() => result.current.fetchNextPage());
  await waitFor(() =>
    expect(result.current.waves.map((wave) => wave.id)).toEqual(ids("b", 0, 40))
  );
  expect(api.mock.calls.map(([request]) => request.cursor)).toEqual([
    undefined,
    "snapshot-a:20",
    undefined,
    "snapshot-b:20",
  ]);
});
