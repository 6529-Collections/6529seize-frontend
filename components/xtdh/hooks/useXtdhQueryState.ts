"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { XtdhCollectionsViewState } from "../collections/XtdhCollectionsView";
import type { XtdhTokensViewState } from "../tokens/XtdhTokensView";

export type XtdhView = "collections" | "tokens";

export const DEFAULT_COLLECTION_SORT: XtdhCollectionsViewState["sort"] = "total_rate";
export const DEFAULT_TOKEN_SORT: XtdhTokensViewState["sort"] = "rate";
export const DEFAULT_DIRECTION: "asc" | "desc" = "desc";

function parseView(value: string | null): XtdhView {
  if (!value) return "collections";
  return value === "tokens" ? "tokens" : "collections";
}

function parseBoolean(value: string | null): boolean {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePage(value: string | null): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDirection(value: string | null): "asc" | "desc" {
  return value?.toLowerCase() === "asc" ? "asc" : "desc";
}

function parseCollectionSort(
  value: string | null
): XtdhCollectionsViewState["sort"] {
  if (!value) return DEFAULT_COLLECTION_SORT;
  const normalized = value.toLowerCase();
  return (["total_rate", "recent", "grantors", "name", "total_allocated"] as const).includes(
    normalized as XtdhCollectionsViewState["sort"]
  )
    ? (normalized as XtdhCollectionsViewState["sort"])
    : DEFAULT_COLLECTION_SORT;
}

function parseTokenSort(value: string | null): XtdhTokensViewState["sort"] {
  if (!value) return DEFAULT_TOKEN_SORT;
  const normalized = value.toLowerCase();
  return (["rate", "recent", "grantors", "name", "collection"] as const).includes(
    normalized as XtdhTokensViewState["sort"]
  )
    ? (normalized as XtdhTokensViewState["sort"])
    : DEFAULT_TOKEN_SORT;
}

export function useXtdhQueryState(connectedProfileId: string | null) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const view = useMemo(
    () => parseView(searchParams?.get("view") ?? null),
    [searchParams]
  );
  const collectionSort = useMemo(
    () => parseCollectionSort(searchParams?.get("sort") ?? null),
    [searchParams]
  );
  const tokenSort = useMemo(
    () => parseTokenSort(searchParams?.get("sort") ?? null),
    [searchParams]
  );
  const direction = parseDirection(searchParams?.get("dir") ?? null);
  const page = parsePage(searchParams?.get("page") ?? null);
  const networks = parseList(searchParams?.get("network") ?? null);
  const minRate = parseNumber(searchParams?.get("min_rate") ?? null);
  const minGrantors = parseNumber(searchParams?.get("min_grantors") ?? null);
  const showMyGrants = parseBoolean(searchParams?.get("my_grants") ?? null);
  const showMyReceiving = parseBoolean(searchParams?.get("receiving") ?? null);

  const defaultSort =
    view === "collections" ? DEFAULT_COLLECTION_SORT : DEFAULT_TOKEN_SORT;
  const activeSort = view === "collections" ? collectionSort : tokenSort;

  const updateQueryParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      if (!pathname) return;

      const params = new URLSearchParams(searchParams?.toString() ?? "");

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const setView = useCallback(
    (nextView: XtdhView) => {
      if (nextView === view) return;

      updateQueryParams({
        view: nextView === "collections" ? null : nextView,
        sort: null,
        dir: null,
        page: "1",
      });
    },
    [updateQueryParams, view]
  );

  const setSort = useCallback(
    (
      nextSort:
        | XtdhCollectionsViewState["sort"]
        | XtdhTokensViewState["sort"]
    ) => {
      const currentDefault =
        view === "collections" ? DEFAULT_COLLECTION_SORT : DEFAULT_TOKEN_SORT;

      const isSame = activeSort === nextSort;
      const nextDirection = isSame
        ? direction === "asc"
          ? "desc"
          : "asc"
        : DEFAULT_DIRECTION;

      updateQueryParams({
        sort: nextSort === currentDefault ? null : nextSort,
        dir: nextDirection === DEFAULT_DIRECTION ? null : nextDirection,
        page: "1",
      });
    },
    [activeSort, direction, updateQueryParams, view]
  );

  const toggleDirection = useCallback(() => {
    const nextDirection = direction === "asc" ? "desc" : "asc";
    updateQueryParams({
      dir: nextDirection === DEFAULT_DIRECTION ? null : nextDirection,
      page: "1",
    });
  }, [direction, updateQueryParams]);

  const setNetworks = useCallback(
    (nextNetworks: string[]) => {
      updateQueryParams({
        network: nextNetworks.length ? nextNetworks.join(",") : null,
        page: "1",
      });
    },
    [updateQueryParams]
  );

  const setMinRate = useCallback(
    (value: number | undefined) => {
      updateQueryParams({
        min_rate:
          typeof value === "number" && Number.isFinite(value) ? value.toString() : null,
        page: "1",
      });
    },
    [updateQueryParams]
  );

  const setMinGrantors = useCallback(
    (value: number | undefined) => {
      updateQueryParams({
        min_grantors:
          typeof value === "number" && Number.isFinite(value)
            ? value.toString()
            : null,
        page: "1",
      });
    },
    [updateQueryParams]
  );

  const toggleMyGrants = useCallback(
    (enabled: boolean) => {
      if (!connectedProfileId) {
        updateQueryParams({
          my_grants: null,
          page: "1",
        });
        return;
      }

      updateQueryParams({
        my_grants: enabled ? "1" : null,
        page: "1",
      });
    },
    [connectedProfileId, updateQueryParams]
  );

  const toggleMyReceiving = useCallback(
    (enabled: boolean) => {
      if (!connectedProfileId) {
        updateQueryParams({
          receiving: null,
          page: "1",
        });
        return;
      }

      updateQueryParams({
        receiving: enabled ? "1" : null,
        page: "1",
      });
    },
    [connectedProfileId, updateQueryParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      updateQueryParams({ page: nextPage.toString() });
    },
    [updateQueryParams]
  );

  return {
    view,
    collectionSort,
    tokenSort,
    direction,
    page,
    networks,
    minRate,
    minGrantors,
    showMyGrants,
    showMyReceiving,
    defaultSort,
    activeSort,
    setView,
    setSort,
    toggleDirection,
    setNetworks,
    setMinRate,
    setMinGrantors,
    toggleMyGrants,
    toggleMyReceiving,
    setPage,
  };
}
