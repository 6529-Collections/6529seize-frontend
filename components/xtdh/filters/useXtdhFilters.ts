"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_COLLECTION_SORT,
  DEFAULT_DIRECTION,
  DEFAULT_TOKEN_SORT,
} from "./constants";
import type {
  XtdhCollectionsSort,
  XtdhCollectionsViewState,
  XtdhTokensSort,
  XtdhTokensViewState,
  XtdhView,
} from "./types";

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

function parseCollectionSort(value: string | null): XtdhCollectionsSort {
  if (!value) return DEFAULT_COLLECTION_SORT;
  const normalized = value.toLowerCase() as XtdhCollectionsSort;

  return (["total_rate", "total_allocated", "grantors"] as const).includes(normalized)
    ? normalized
    : DEFAULT_COLLECTION_SORT;
}

function parseTokenSort(value: string | null): XtdhTokensSort {
  if (!value) return DEFAULT_TOKEN_SORT;
  const normalized = value.toLowerCase() as XtdhTokensSort;

  return (["rate", "total_allocated", "grantors"] as const).includes(normalized)
    ? normalized
    : DEFAULT_TOKEN_SORT;
}

export function useXtdhFilters(connectedProfileId: string | null) {
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
      nextSort: XtdhCollectionsViewState["sort"] | XtdhTokensViewState["sort"]
    ) => {
      const currentDefault =
        view === "collections" ? DEFAULT_COLLECTION_SORT : DEFAULT_TOKEN_SORT;

      updateQueryParams({
        sort: nextSort === currentDefault ? null : nextSort,
        page: "1",
      });
    },
    [updateQueryParams, view]
  );

  const setSortDirection = useCallback(
    (nextDirection: "asc" | "desc") => {
      updateQueryParams({
        dir: nextDirection === DEFAULT_DIRECTION ? null : nextDirection,
        page: "1",
      });
    },
    [updateQueryParams]
  );

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

  const resetFilters = useCallback(() => {
    updateQueryParams({
      sort: null,
      dir: null,
      network: null,
      min_rate: null,
      min_grantors: null,
      my_grants: null,
      receiving: null,
      page: "1",
    });
  }, [updateQueryParams]);

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
    setView,
    setSort,
    setSortDirection,
    setNetworks,
    setMinRate,
    setMinGrantors,
    toggleMyGrants,
    toggleMyReceiving,
    setPage,
    resetFilters,
  };
}
