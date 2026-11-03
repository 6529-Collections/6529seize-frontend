jest.unmock("react-use");
import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWaveSidebarSearch } from "@/hooks/useWaveSidebarSearch";
import { useSidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";
import {
  useWaveSidebarCollection,
  type WaveSidebarCollection,
} from "@/hooks/useWaveSidebarCollection";
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
function selectCollection(collection: WaveSidebarCollection) {
  const { result, unmount } = renderHook(() => useWaveSidebarCollection());
  act(() => result.current[1](collection));
  unmount();
}
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const container = document.createElement("div");
  Object.defineProperties(container, {
    scrollHeight: { value: 2000, configurable: true },
    clientHeight: { value: 500 },
  });
  const scrollContainerRef = { current: container };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...renderHook(
      ({ list }: { list: typeof waves } = { list: waves }) =>
        useSidebarWaveNavigation({ waves: list, scrollContainerRef }),
      { wrapper, initialProps: { list: waves } }
    ),
    container,
  };
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
  mockViewer = { key: "alice", canUseCollections: true, enabled: true };
  const search = renderHook(() => useWaveSidebarSearch("alice"));
  act(() => search.result.current[1](""));
  search.unmount();
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

it("keeps search open for an empty query until explicitly closed", () => {
  const { result } = setup();
  expect(result.current.searchOpen).toBe(false);
  act(() => result.current.setSearchOpen(true));
  expect(result.current.searchOpen).toBe(true);
  expect(result.current.searching).toBe(false);
  expect(result.current.queryEnabled).toBe(false);
  act(() => result.current.setQueryText("xx"));
  expect(result.current.searching).toBe(true);
  act(() => result.current.setQueryText(""));
  expect(result.current.searchOpen).toBe(true);
  act(() => result.current.setSearchOpen(false));
  expect(result.current.searchOpen).toBe(false);
});

it("keeps the search input visible whenever a nonempty query is being searched", () => {
  const { result } = setup();
  act(() => result.current.setQueryText("xx"));
  expect(result.current.searching).toBe(true);
  expect(result.current.searchOpen).toBe(true);
  act(() => result.current.setSearchOpen(false));
  expect(result.current.searching).toBe(true);
  expect(result.current.searchOpen).toBe(true);
  act(() => result.current.setQueryText(""));
  expect(result.current.searching).toBe(false);
  expect(result.current.searchOpen).toBe(false);
});

it("searches across all accessible waves from Pinned and restores Pinned when cleared", async () => {
  selectCollection("pinned");
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

it("keeps the query during in-page remounts and isolates a different viewer", () => {
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

it("ignores a previously saved search and restores the last collection", () => {
  sessionStorage.setItem("wave-sidebar-search:alice", "old query");
  selectCollection("joined");
  const { result } = setup();
  expect(result.current.queryText).toBe("");
  expect(result.current.searching).toBe(false);
  expect(result.current.collection).toBe("joined");
  expect(result.current.visibleWaves.map((wave) => wave.id)).toEqual([
    "joined",
  ]);
  act(() => result.current.setQueryText("new query"));
  expect(sessionStorage.getItem("wave-sidebar-search:alice")).toBe("old query");
});

it("uses All after logout even with a saved personal collection", () => {
  selectCollection("pinned");
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
  selectCollection("joined");
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

it("keeps a saved offset when restoration is clamped by rows still loading", () => {
  const { result, container, rerender } = setup();
  act(() => {
    container.scrollTop = 1000;
    container.dispatchEvent(new Event("scroll"));
  });
  act(() => result.current.setCollection("pinned"));
  Object.defineProperty(container, "scrollHeight", {
    value: 600,
    configurable: true,
  });
  act(() => result.current.setCollection("all"));
  // Model the browser clamping an attempted restoration to the current maximum.
  act(() => {
    container.scrollTop = 100;
    container.dispatchEvent(new Event("scroll"));
  });
  Object.defineProperty(container, "scrollHeight", {
    value: 2000,
    configurable: true,
  });
  rerender({ list: [...waves, createMockMinimalWave({ id: "loaded" })] });
  expect(container.scrollTop).toBe(1000);
});

it("respects user scrolling while a saved offset cannot yet be restored", () => {
  const { result, container, rerender } = setup();
  act(() => {
    container.scrollTop = 1000;
    container.dispatchEvent(new Event("scroll"));
  });
  act(() => result.current.setCollection("pinned"));
  Object.defineProperty(container, "scrollHeight", {
    value: 600,
    configurable: true,
  });
  act(() => result.current.setCollection("all"));
  act(() => {
    container.scrollTop = 50;
    container.dispatchEvent(new Event("scroll"));
  });
  Object.defineProperty(container, "scrollHeight", {
    value: 2000,
    configurable: true,
  });
  rerender({ list: [...waves, createMockMinimalWave({ id: "loaded" })] });
  expect(container.scrollTop).toBe(50);
});

it("retains search scroll through pagination and refetch, then remembers the clamped position after results shrink", async () => {
  fetchPage.mockImplementation(async ({ page }) => ({
    waves: [{ id: `result-${page}` } as never],
    page,
    next: page === 1,
  }));
  const { result, container } = setup();
  act(() => result.current.setQueryText("rare pepe"));
  await waitFor(() => expect(result.current.resultWaves).toHaveLength(1));
  act(() => {
    container.scrollTop = 700;
    container.dispatchEvent(new Event("scroll"));
  });
  await act(async () => {
    await result.current.results.fetchNextPage();
  });
  await waitFor(() => expect(result.current.resultWaves).toHaveLength(2));
  expect(container.scrollTop).toBe(700);
  await act(async () => {
    await result.current.results.refetch();
  });
  expect(container.scrollTop).toBe(700);
  fetchPage.mockResolvedValue({
    waves: [{ id: "smaller" } as never],
    page: 1,
    next: false,
  });
  Object.defineProperty(container, "scrollHeight", {
    value: 650,
    configurable: true,
  });
  await act(async () => {
    await result.current.results.refetch();
  });
  await waitFor(() => expect(result.current.resultWaves).toHaveLength(1));
  act(() => {
    container.scrollTop = 150;
    container.dispatchEvent(new Event("scroll"));
  });
  act(() => result.current.setQueryText(""));
  act(() => result.current.setQueryText("rare pepe"));
  await waitFor(() => expect(result.current.queryEnabled).toBe(true));
  expect(container.scrollTop).toBe(150);
});

it.each(["wheel", "touchstart", "pointerdown", "keydown"])(
  "preserves the exact clamped maximum after %s interaction",
  (eventType) => {
    const { result, container, rerender } = setup();
    act(() => {
      container.scrollTop = 1000;
      container.dispatchEvent(new Event("scroll"));
    });
    act(() => result.current.setCollection("pinned"));
    Object.defineProperty(container, "scrollHeight", {
      value: 600,
      configurable: true,
    });
    act(() => result.current.setCollection("all"));
    act(() => {
      container.scrollTop = 100;
      container.dispatchEvent(new Event("scroll"));
      container.dispatchEvent(new Event(eventType));
    });
    Object.defineProperty(container, "scrollHeight", {
      value: 2000,
      configurable: true,
    });
    rerender({ list: [...waves, createMockMinimalWave({ id: "loaded" })] });
    expect(container.scrollTop).toBe(100);
    act(() => result.current.setCollection("pinned"));
    act(() => result.current.setCollection("all"));
    expect(container.scrollTop).toBe(100);
  }
);
