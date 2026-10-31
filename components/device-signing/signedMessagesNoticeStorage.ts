"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "6529-signed-messages-notice";
const CHANGE_EVENT = "6529-signed-messages-notice-change";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SEEN_GRANTS = 200;

interface AddressNoticeState {
  /** The enable/renew prompt stays hidden until this time (ms). */
  readonly dismissedUntil?: number;
  /** Grant ids this browser has already shown or baselined. */
  readonly seenGrantIds?: readonly string[];
}

type NoticeState = Readonly<Record<string, AddressNoticeState>>;

// The state of this page session. Read instead of localStorage when it is
// unavailable or the last write to it failed (quota, some private modes),
// so a dismissal or a seen alert still takes effect until a write succeeds.
let memorySnapshot = "";
let lastWriteFailed = false;

function readRaw(): string {
  if (lastWriteFailed) {
    return memorySnapshot;
  }
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return memorySnapshot;
  }
}

function parseState(raw: string): NoticeState {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as NoticeState)
      : {};
  } catch {
    return {};
  }
}

function updateAddressState(
  address: string,
  update: (current: AddressNoticeState) => AddressNoticeState
): void {
  const state = parseState(readRaw());
  const raw = JSON.stringify({
    ...state,
    [address]: update(state[address] ?? {}),
  });
  memorySnapshot = raw;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, raw);
    lastWriteFailed = false;
  } catch {
    // Keep the in-memory state for this page session.
    lastWriteFailed = true;
  }
  globalThis.dispatchEvent(new Event(CHANGE_EVENT));
}

export function dismissSignedMessagesNotice(
  address: string,
  nowMs: number
): void {
  updateAddressState(address, (current) => ({
    ...current,
    dismissedUntil: nowMs + DISMISS_MS,
  }));
}

export function markDeviceGrantsSeen(
  address: string,
  grantIds: readonly string[]
): void {
  updateAddressState(address, (current) => {
    const seen = new Set([...(current.seenGrantIds ?? []), ...grantIds]);
    return { ...current, seenGrantIds: [...seen].slice(-MAX_SEEN_GRANTS) };
  });
}

function subscribe(onChange: () => void): () => void {
  globalThis.addEventListener("storage", onChange);
  globalThis.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    globalThis.removeEventListener("storage", onChange);
    globalThis.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const getServerSnapshot = (): string => "";

/** Per-address dismissal and seen-grant state, kept in localStorage. */
export function useSignedMessagesNoticeState(
  address: string | null
): AddressNoticeState {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  return address ? (parseState(raw)[address] ?? {}) : {};
}
