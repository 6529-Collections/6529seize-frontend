jest.unmock("react-use");
import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";
import { setWaveSidebarCollection } from "@/hooks/useWaveSidebarCollection";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";

let mockViewer = { key: "alice", canUseCollections: true, enabled: true };
jest.mock("@/hooks/useWaveDiscoveryViewer", () => ({
  useWaveDiscoveryViewer: () => mockViewer,
}));
jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWavesV2Page: jest.fn(),
}));
const fetchPage = jest.mocked(fetchWavesV2Page);
const waves = [
  createMockMinimalWave({ id: "pin", isPinned: true, isFollowing: false }),
  createMockMinimalWave({ id: "joined", isFollowing: true }),
  createMockMinimalWave({ id: "other", isFollowing: false }),
];
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const container = document.createElement("div");
  Object.defineProperties(container, {
    scrollHeight: { value: 2000 },
    clientHeight: { value: 500 },
  });
  const scrollContainerRef = { current: container };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...renderHook(
      () => useSidebarWaveNavigation({ waves, scrollContainerRef }),
      { wrapper }
    ),
    container,
  };
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
  mockViewer = { key: "alice", canUseCollections: true, enabled: true };
  fetchPage.mockResolvedValue({ waves: [], page: 1, next: false });
});

it("switches collections without making Pinned a prerequisite for All and restores scroll", () => {
  const { result, container } = setup();
  act(() => {
    container.scrollTop = 300;
    container.dispatchEvent(new Event("scroll"));
  });
  act(() => result.current.setCollection("pinned"));
  expect(result.current.visibleWaves.map((w) => w.id)).toEqual(["pin"]);
  expect(container.scrollTop).toBe(0);
  act(() => result.current.setCollection("joined"));
  expect(result.current.visibleWaves.map((w) => w.id)).toEqual(["joined"]);
  act(() => result.current.setCollection("all"));
  expect(result.current.visibleWaves).toHaveLength(3);
  expect(container.scrollTop).toBe(300);
});

it("searches across all accessible waves from Pinned and restores Pinned when cleared", async () => {
  setWaveSidebarCollection("pinned");
  const { result } = setup();
  act(() => result.current.setQueryText("rare pepe"));
  await waitFor(() =>
    expect(fetchPage).toHaveBeenCalledWith({
      view: "SEARCH",
      page: 1,
      pageSize: 20,
      name: "rare pepe",
      directMessage: false,
    })
  );
  expect(result.current.searching).toBe(true);
  act(() => result.current.setQueryText(""));
  expect(result.current.searching).toBe(false);
  expect(result.current.collection).toBe("pinned");
  expect(result.current.visibleWaves.map((w) => w.id)).toEqual(["pin"]);
});

it("hides old results immediately while a new query is debouncing", async () => {
  fetchPage.mockResolvedValue({
    waves: [{ id: "result" } as never],
    page: 1,
    next: true,
  });
  const { result } = setup();
  act(() => result.current.setQueryText("rare"));
  await waitFor(() => expect(result.current.resultWaves).toHaveLength(1));
  act(() => result.current.setQueryText("different"));
  expect(result.current.resultWaves).toEqual([]);
  expect(result.current.queryEnabled).toBe(false);
});

it("restores the query after remount and isolates a different viewer", () => {
  const first = setup();
  act(() => first.result.current.setQueryText("rare pepe"));
  first.unmount();
  const second = setup();
  expect(second.result.current.queryText).toBe("rare pepe");
  mockViewer = { key: "bob", canUseCollections: true, enabled: true };
  second.rerender();
  expect(second.result.current.queryText).toBe("");
  expect(second.result.current.resultWaves).toEqual([]);
});

it("uses All after logout even with a saved personal collection", () => {
  setWaveSidebarCollection("pinned");
  const { result, rerender } = setup();
  mockViewer = { key: "guest", canUseCollections: false, enabled: true };
  rerender();
  expect(result.current.collection).toBe("all");
  expect(result.current.visibleWaves).toHaveLength(3);
});

it("paginates the search query without adding the selected collection as a filter", async () => {
  fetchPage.mockImplementation(async ({ page }) => ({
    waves: [{ id: `result-${page}` } as never],
    page,
    next: page === 1,
  }));
  setWaveSidebarCollection("joined");
  const { result } = setup();
  act(() => result.current.setQueryText("rare pepe"));
  await waitFor(() => expect(result.current.results.hasNextPage).toBe(true));
  await act(async () => {
    await result.current.results.fetchNextPage();
  });
  await waitFor(() =>
    expect(result.current.resultWaves.map((wave) => wave.id)).toEqual([
      "result-1",
      "result-2",
    ])
  );
  expect(fetchPage).toHaveBeenLastCalledWith({
    view: "SEARCH",
    page: 2,
    pageSize: 20,
    name: "rare pepe",
    directMessage: false,
  });
  expect(result.current.results.hasNextPage).toBe(false);
});

it("keeps collection switching usable when browser storage rejects writes", () => {
  const spy = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Storage disabled");
    });
  const { result } = setup();
  try {
    act(() => result.current.setCollection("pinned"));
    expect(result.current.collection).toBe("pinned");
  } finally {
    spy.mockRestore();
    act(() => result.current.setCollection("all"));
  }
});
