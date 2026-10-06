"use client";

import { useCallback, useEffect, useRef } from "react";
import useLocalPreference from "@/hooks/useLocalPreference";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { MyStreamWaveTab } from "@/types/waves.types";

export const WAVE_TAB_STORAGE_KEY = "memes_wave_last_tab_by_id";
type RememberedWaveTab =
  | MyStreamWaveTab
  | { readonly tab: MyStreamWaveTab; readonly competitionId: string };
type WaveTabs = Record<string, RememberedWaveTab>;

export const getRememberedTab = (value: RememberedWaveTab | undefined) =>
  typeof value === "object" ? value.tab : value;

const isWaveTab = (value: unknown): value is MyStreamWaveTab =>
  Object.values(MyStreamWaveTab).includes(value as MyStreamWaveTab);
const isRememberedTab = (value: unknown): value is RememberedWaveTab => {
  if (isWaveTab(value)) return true;
  if (value === null || typeof value !== "object") return false;
  return (
    "tab" in value &&
    isWaveTab(value.tab) &&
    "competitionId" in value &&
    typeof value.competitionId === "string" &&
    value.competitionId.length > 0
  );
};
const isWaveTabMap = (value: unknown): value is WaveTabs =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.values(value).every(isRememberedTab);

export const hasWaveDestination = (search: { has: (key: string) => boolean }) =>
  [
    "tab",
    "competition",
    "drop",
    "entry",
    "serialNo",
    "curation",
    "editPost",
    "edit",
    "create",
  ].some((key) => search.has(key));

const HISTORY_TAB_KEY = "waveTabSelection";
export function getHistoryWaveTab(
  waveId: string | undefined
): RememberedWaveTab | undefined {
  if (typeof window === "undefined" || !waveId) return undefined;
  const state: unknown = window.history.state;
  if (
    state === null ||
    typeof state !== "object" ||
    !(HISTORY_TAB_KEY in state)
  )
    return undefined;
  const saved: unknown = state[HISTORY_TAB_KEY];
  if (
    saved === null ||
    typeof saved !== "object" ||
    !("waveId" in saved) ||
    !("value" in saved)
  )
    return undefined;
  return saved.waveId === waveId && isRememberedTab(saved.value)
    ? saved.value
    : undefined;
}
export function rememberHistoryWaveTab(
  waveId: string | null | undefined,
  value: RememberedWaveTab
) {
  if (typeof window === "undefined" || !waveId) return;
  const url = new URL(window.location.href);
  if (
    getActiveWaveIdFromUrl({
      pathname: url.pathname,
      searchParams: url.searchParams,
    }) !== waveId
  )
    return;
  window.history.replaceState(
    { ...window.history.state, [HISTORY_TAB_KEY]: { waveId, value } },
    ""
  );
}

// Retain the existing browser-local lifetime and storage key, including old
// unqualified tab values. Only deliberate selections or committed destinations
// write a preference; loading, fallback and cleanup never do.
export function useWaveTabPreference(storageKey = WAVE_TAB_STORAGE_KEY) {
  const [tabs, setTabs] = useLocalPreference<WaveTabs>(
    storageKey,
    {},
    isWaveTabMap
  );
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);
  const rememberTab = useCallback(
    (waveId: string, tab: MyStreamWaveTab, competitionId?: string | null) => {
      const value: RememberedWaveTab = competitionId
        ? { tab, competitionId }
        : tab;
      const previous = tabsRef.current[waveId];
      const unchanged =
        typeof value === "string"
          ? previous === value
          : typeof previous === "object" &&
            previous.tab === value.tab &&
            previous.competitionId === value.competitionId;
      if (unchanged) return;
      const next = { ...tabsRef.current, [waveId]: value };
      tabsRef.current = next;
      setTabs(next);
    },
    [setTabs]
  );
  return { tabs, tabsRef, rememberTab };
}
