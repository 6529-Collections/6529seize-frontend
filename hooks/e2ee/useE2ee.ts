"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  type E2eeContextValue,
  useE2eeContext,
} from "@/components/e2ee/E2eeContext";
import type {
  E2eeConversationSnapshot,
  E2eeEngineSnapshot,
  E2eeEngineStore,
} from "@/components/e2ee/e2eeEngineStore";
import type {
  E2eeConversation,
  E2eeDeviceInfo,
  E2eeEngine,
  E2eeEngineStatus,
  E2eeMessage,
} from "@/lib/e2ee/types";
import { useMutedE2eeChats } from "@/components/e2ee/e2eeMutedChats";

/**
 * UI status: provider availability first, then engine status.
 * - disabled: build has encrypted messages off
 * - unavailable: no profile or no connected wallet
 * - proxy: acting as a proxy (encrypted chat is not available)
 * - idle: allowed but the engine has not been loaded
 * - load-failed: the engine module or instance failed to load
 * - elsewhere: encrypted messages are open in another tab
 */
export type E2eeUiStatus =
  | "disabled"
  | "unavailable"
  | "proxy"
  | "idle"
  | "load-failed"
  | "elsewhere"
  | E2eeEngineStatus;

export interface UseE2eeResult {
  readonly enabled: boolean;
  readonly status: E2eeUiStatus;
  /** Engine or load error code (never user copy). */
  readonly error: string | null;
  readonly profileId: string | null;
  readonly engine: E2eeEngine | null;
  readonly thisDevice: E2eeDeviceInfo | null;
  readonly devices: readonly E2eeDeviceInfo[];
  readonly conversations: readonly E2eeConversation[];
  /** Server switch; attaching is hidden while false (and until it is known). */
  readonly attachmentsEnabled: boolean;
  readonly restart: () => void;
  /** "Use here": take the engine over from the tab that holds it. */
  readonly takeOverHere: () => void;
}

const EMPTY_DEVICES: readonly E2eeDeviceInfo[] = [];
const EMPTY_CONVERSATIONS: readonly E2eeConversation[] = [];
const EMPTY_MESSAGES: readonly E2eeMessage[] = [];

const noopSubscribe = () => () => undefined;
const getNullSnapshot = () => null;

function useEngineSnapshot(
  store: E2eeEngineStore | null
): E2eeEngineSnapshot | null {
  return useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? store.getSnapshot : getNullSnapshot,
    getNullSnapshot
  );
}

function resolveStatus(
  context: E2eeContextValue,
  snapshot: E2eeEngineSnapshot | null
): E2eeUiStatus {
  switch (context.availability) {
    case "loaded":
      return snapshot?.status ?? "loading";
    case "failed":
      return "load-failed";
    case "elsewhere":
      return "elsewhere";
    case "disabled":
    case "unavailable":
    case "proxy":
    case "idle":
    case "loading":
      return context.availability;
  }
}

/** Encrypted-messages state for the signed-in profile (contract 12). */
export function useE2ee(): UseE2eeResult {
  const context = useE2eeContext();
  const snapshot = useEngineSnapshot(context.store);

  return useMemo<UseE2eeResult>(
    () => ({
      enabled: context.availability !== "disabled",
      status: resolveStatus(context, snapshot),
      error: context.loadError ?? snapshot?.error ?? null,
      profileId: context.profileId,
      engine: context.engine,
      thisDevice: snapshot?.thisDevice ?? null,
      devices: snapshot?.devices ?? EMPTY_DEVICES,
      conversations: snapshot?.conversations ?? EMPTY_CONVERSATIONS,
      attachmentsEnabled: snapshot?.attachmentsEnabled ?? false,
      restart: context.restart,
      takeOverHere: context.takeOverHere,
    }),
    [context, snapshot]
  );
}

interface UseE2eeConversationResult {
  readonly conversation: E2eeConversation | null;
  readonly messages: readonly E2eeMessage[];
}

/** One conversation and its timeline, re-rendered on engine changes. */
export function useE2eeConversation(
  g: string | null
): UseE2eeConversationResult {
  const { store } = useE2eeContext();
  const getSnapshot = useCallback(
    (): E2eeConversationSnapshot | null =>
      store && g ? store.getConversationSnapshot(g) : null,
    [store, g]
  );
  const snapshot = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    getSnapshot,
    getNullSnapshot
  );
  return {
    conversation: snapshot?.conversation ?? null,
    messages: snapshot?.messages ?? EMPTY_MESSAGES,
  };
}

interface E2eeUnreadSummary {
  readonly unread: number;
  readonly mentions: number;
  readonly hasUnread: boolean;
}

/** Unread and mention totals across active encrypted chats. */
export function useE2eeUnreadSummary(): E2eeUnreadSummary {
  const { conversations, profileId } = useE2ee();
  const muted = useMutedE2eeChats(profileId);
  return useMemo(() => {
    let unread = 0;
    let mentions = 0;
    for (const conversation of conversations) {
      // Chats muted on this device do not count toward the Messages badge.
      if (conversation.status === "active" && !muted.has(conversation.g)) {
        unread += conversation.unread;
        mentions += conversation.mentions;
      }
    }
    return { unread, mentions, hasUnread: unread > 0 || mentions > 0 };
  }, [conversations, muted]);
}
