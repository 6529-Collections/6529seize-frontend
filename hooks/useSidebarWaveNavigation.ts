"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useDebounce } from "react-use";
import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import { useWaveSidebarSearch } from "./useWaveSidebarSearch";
import { useWaveDiscoveryViewer } from "./useWaveDiscoveryViewer";
import {
  useWaveSidebarCollection,
  type WaveSidebarCollection,
} from "./useWaveSidebarCollection";

function selectSidebarCollection(
  waves: readonly MinimalWave[],
  collection: WaveSidebarCollection,
  activeContainerId?: string | null
): MinimalWave[] {
  return waves
    .filter((wave) => {
      if (collection === "pinned") return wave.isPinned;
      if (collection === "joined")
        return (
          wave.isFollowing ||
          wave.isFollowedSubwaveContainer ||
          wave.id === activeContainerId
        );
      return wave.isInAllWaves !== false || wave.isPinned;
    })
    .sort(
      (left, right) =>
        Number(left.isMuted) - Number(right.isMuted) ||
        (right.sidebarActivityTimestamp ?? 0) -
          (left.sidebarActivityTimestamp ?? 0)
    );
}

function restoreSidebarScroll(container: HTMLElement, top: number) {
  container.scrollTop = top;
}

export function useSidebarWaveNavigation({
  waves,
  scrollContainerRef,
  enabled = true,
  activeContainerId,
}: {
  readonly waves: readonly MinimalWave[];
  readonly scrollContainerRef: RefObject<HTMLElement | null>;
  readonly enabled?: boolean;
  readonly activeContainerId?: string | null;
}) {
  const viewer = useWaveDiscoveryViewer();
  const [savedCollection, setCollection] = useWaveSidebarCollection();
  const collection = viewer.canUseCollections ? savedCollection : "all";
  const [queryText, setQueryText] = useWaveSidebarSearch(viewer.key ?? "guest");
  const [searchOpen, setSearchOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  useDebounce(() => setDebounced(queryText.trim()), 350, [queryText]);
  const searching = enabled && queryText.trim().length > 0;
  const queryEnabled =
    searching &&
    viewer.enabled &&
    debounced.length >= 3 &&
    debounced === queryText.trim();
  const results = useInfiniteQuery({
    queryKey: [
      QueryKey.WAVES_SEARCH,
      { surface: "sidebar", viewer: viewer.key, name: debounced },
    ],
    queryFn: ({ pageParam }) =>
      fetchWavesV2Page({
        view: ApiWavesV2ListType.Search,
        page: pageParam,
        pageSize: 20,
        name: debounced,
        directMessage: false,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.next ? last.page + 1 : undefined),
    enabled: queryEnabled,
  });
  const visibleWaves = useMemo(
    () =>
      enabled
        ? selectSidebarCollection(waves, collection, activeContainerId)
        : [...waves],
    [waves, collection, enabled, activeContainerId]
  );
  const positions = useRef(new Map<string, number>());
  const viewKey = searching ? "search:" + queryText.trim() : collection;
  const scrollKey = `${viewer.key ?? "guest"}:${viewKey}`;
  const restoredKey = useRef<string | null>(null);
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!enabled || !container) return;
    const desired = positions.current.get(scrollKey) ?? 0;
    if (restoredKey.current !== scrollKey) {
      restoreSidebarScroll(container, desired);
      // Retry restoration after an asynchronously loaded collection gets taller.
      if (container.scrollHeight - container.clientHeight >= desired)
        restoredKey.current = scrollKey;
    }
    const onScroll = () => {
      const clamped = Math.min(
        desired,
        Math.max(0, container.scrollHeight - container.clientHeight)
      );
      // A programmatic restore may be clamped until async rows finish loading.
      // Keep the original target; a different position reflects user scrolling.
      if (restoredKey.current !== scrollKey && container.scrollTop === clamped)
        return;
      positions.current.set(scrollKey, container.scrollTop);
      restoredKey.current = scrollKey;
    };
    // Any direct interaction takes over from a pending restoration, even when
    // the user is already at the short list's maximum and no scroll event fires.
    const onInteraction = () => {
      positions.current.set(scrollKey, container.scrollTop);
      restoredKey.current = scrollKey;
    };
    const interactionEvents = [
      "wheel",
      "touchstart",
      "pointerdown",
      "keydown",
    ] as const;
    container.addEventListener("scroll", onScroll, { passive: true });
    for (const event of interactionEvents)
      container.addEventListener(event, onInteraction, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      for (const event of interactionEvents)
        container.removeEventListener(event, onInteraction);
    };
  }, [
    enabled,
    scrollContainerRef,
    scrollKey,
    visibleWaves.length,
    results.data,
  ]);

  return {
    collection,
    setCollection,
    canUseCollections: viewer.canUseCollections,
    visibleWaves,
    searchOpen: enabled && (searchOpen || searching),
    setSearchOpen,
    searching,
    queryText,
    setQueryText,
    results,
    resultWaves: queryEnabled
      ? (results.data?.pages.flatMap((page) => page.waves) ?? [])
      : [],
    queryEnabled,
    scrollKey,
  };
}

export type SidebarWaveNavigation = ReturnType<typeof useSidebarWaveNavigation>;
