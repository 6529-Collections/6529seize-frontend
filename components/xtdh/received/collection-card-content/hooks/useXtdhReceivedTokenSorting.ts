'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

import type { XtdhReceivedNft } from "@/types/xtdh";

import { getXtdhReceivedTokenGrantorCount } from "../utils/tokenGrantors";

export type XtdhReceivedTokenSortKey = "rate" | "received" | "grantors";

export type XtdhReceivedTokenSortDirection = "asc" | "desc";

export interface XtdhReceivedTokenSortState {
  readonly key: XtdhReceivedTokenSortKey;
  readonly direction: XtdhReceivedTokenSortDirection;
}

interface XtdhReceivedTokenSortingResult {
  readonly sortedTokens: readonly XtdhReceivedNft[];
  readonly sortKey: XtdhReceivedTokenSortKey;
  readonly sortDirection: XtdhReceivedTokenSortDirection;
  readonly requestSort: (key: XtdhReceivedTokenSortKey) => void;
}

const DEFAULT_SORT_STATE: XtdhReceivedTokenSortState = {
  key: "rate",
  direction: "desc",
};

const STORAGE_KEY = "xtdh:received:token-sort";

function readSortPreference(): XtdhReceivedTokenSortState {
  if (typeof window === "undefined") {
    return DEFAULT_SORT_STATE;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SORT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<XtdhReceivedTokenSortState>;
    const key: XtdhReceivedTokenSortKey = parsed.key === "received" || parsed.key === "grantors"
      ? parsed.key
      : "rate";
    const direction: XtdhReceivedTokenSortDirection =
      parsed.direction === "asc" || parsed.direction === "desc"
        ? parsed.direction
        : "desc";

    return {
      key,
      direction,
    };
  } catch {
    return DEFAULT_SORT_STATE;
  }
}

function persistSortPreference(state: XtdhReceivedTokenSortState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (e.g., quota exceeded, privacy mode).
  }
}

function compareValues(a: number, b: number): number {
  if (Number.isNaN(a) && Number.isNaN(b)) {
    return 0;
  }

  if (Number.isNaN(a)) {
    return -1;
  }

  if (Number.isNaN(b)) {
    return 1;
  }

  return a - b;
}

function sortTokens(
  tokens: readonly XtdhReceivedNft[],
  { key, direction }: XtdhReceivedTokenSortState,
): readonly XtdhReceivedNft[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...tokens].sort((a, b) => {
    switch (key) {
      case "received": {
        const value = compareValues(a.totalXtdhReceived, b.totalXtdhReceived);
        if (value !== 0) {
          return value * factor;
        }
        break;
      }
      case "grantors": {
        const value = compareValues(
          getXtdhReceivedTokenGrantorCount(a),
          getXtdhReceivedTokenGrantorCount(b),
        );
        if (value !== 0) {
          return value * factor;
        }
        break;
      }
      case "rate":
      default: {
        const value = compareValues(a.xtdhRate, b.xtdhRate);
        if (value !== 0) {
          return value * factor;
        }
        break;
      }
    }

    return a.tokenName.localeCompare(b.tokenName);
  });
}

export function useXtdhReceivedTokenSorting(
  tokens: readonly XtdhReceivedNft[],
): XtdhReceivedTokenSortingResult {
  const [sortState, setSortState] = useState<XtdhReceivedTokenSortState>(
    () => readSortPreference(),
  );

  useEffect(() => {
    persistSortPreference(sortState);
  }, [sortState]);

  const sortedTokens = useMemo(
    () => sortTokens(tokens, sortState),
    [tokens, sortState],
  );

  const requestSort = useCallback((key: XtdhReceivedTokenSortKey) => {
    setSortState((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "desc",
      };
    });
  }, []);

  return {
    sortedTokens,
    sortKey: sortState.key,
    sortDirection: sortState.direction,
    requestSort,
  };
}

