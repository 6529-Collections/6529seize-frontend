import type { ApiDeleteMyWaveChatHistoryResponse } from "@/generated/models/ApiDeleteMyWaveChatHistoryResponse";
import type { ApiWaveChatHistoryPurgePlan } from "@/generated/models/ApiWaveChatHistoryPurgePlan";
import {
  commonApiDeleteWithResponse,
  commonApiPost,
} from "@/services/api/common-api";

type ChatHistoryPurgeState = {
  readonly phase: "idle" | "running" | "paused" | "complete";
  readonly token: string | null;
  readonly deletedCount: number;
  readonly error: unknown;
};
export const EMPTY_PURGE: ChatHistoryPurgeState = {
  phase: "idle",
  token: null,
  deletedCount: 0,
  error: null,
};
const states = new Map<string, ChatHistoryPurgeState>();
const listeners = new Map<string, Set<() => void>>();
const storageKey = (key: string) => `6529-chat-history-purge:${key}`;

export function getChatHistoryPurge(key: string): ChatHistoryPurgeState {
  const existing = states.get(key);
  if (existing) return existing;
  let state = EMPTY_PURGE;
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(storageKey(key)) ?? "null"
    ) as unknown;
    if (
      typeof saved === "object" &&
      saved !== null &&
      "token" in saved &&
      typeof saved.token === "string" &&
      saved.token.length > 0 &&
      "deletedCount" in saved &&
      typeof saved.deletedCount === "number" &&
      Number.isSafeInteger(saved.deletedCount) &&
      saved.deletedCount >= 0
    ) {
      state = {
        ...EMPTY_PURGE,
        phase: "paused",
        token: saved.token,
        deletedCount: saved.deletedCount,
      };
    }
  } catch {
    // In-memory recovery remains available when browser storage is unavailable.
  }
  states.set(key, state);
  return state;
}

export function subscribeChatHistoryPurge(key: string, listener: () => void) {
  const subscribers = listeners.get(key) ?? new Set<() => void>();
  subscribers.add(listener);
  listeners.set(key, subscribers);
  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0) listeners.delete(key);
  };
}

function saveState(key: string, state: ChatHistoryPurgeState) {
  states.set(key, state);
  try {
    if (state.token && state.phase !== "complete") {
      sessionStorage.setItem(
        storageKey(key),
        JSON.stringify({ token: state.token, deletedCount: state.deletedCount })
      );
    } else {
      sessionStorage.removeItem(storageKey(key));
    }
  } catch {
    // Keep the original token in memory even when storage is unavailable.
  }
  listeners.get(key)?.forEach((listener) => listener());
}

function validateBatch(
  response: unknown
): asserts response is ApiDeleteMyWaveChatHistoryResponse {
  if (
    typeof response !== "object" ||
    response === null ||
    !("has_more" in response) ||
    !("deleted_drop_ids" in response) ||
    typeof response.has_more !== "boolean" ||
    !Array.isArray(response.deleted_drop_ids) ||
    !response.deleted_drop_ids.every((id) => typeof id === "string") ||
    (response.has_more && response.deleted_drop_ids.length === 0)
  ) {
    throw new Error("Invalid chat history deletion response");
  }
}

function getPreparedToken(plan: unknown): string {
  if (
    typeof plan !== "object" ||
    plan === null ||
    !("purge_token" in plan) ||
    typeof plan.purge_token !== "string" ||
    plan.purge_token.length === 0
  ) {
    throw new Error("Invalid chat history preparation response");
  }
  return plan.purge_token;
}

export async function runChatHistoryPurge({
  key,
  waveId,
  signal,
  authenticate,
  onBatch,
  onSettled,
}: {
  readonly key: string;
  readonly waveId: string;
  readonly signal: AbortSignal;
  readonly authenticate: () => Promise<{ success: boolean }>;
  readonly onBatch: (dropIds: string[]) => void;
  readonly onSettled: (completed: boolean, deletedCount: number) => void;
}) {
  const previous = getChatHistoryPurge(key);
  if (previous.phase === "running") return;
  let state = previous.phase === "complete" ? EMPTY_PURGE : previous;
  let deletionStarted = false;
  saveState(key, { ...state, phase: "running", error: null });
  try {
    const { success } = await authenticate();
    signal.throwIfAborted();
    if (!success) {
      saveState(key, state);
      return;
    }
    const endpoint = `waves/${waveId}/my-chat-history`;
    if (!state.token) {
      const plan = await commonApiPost<
        Record<string, never>,
        ApiWaveChatHistoryPurgePlan
      >({ endpoint, body: {}, signal });
      signal.throwIfAborted();
      state = { ...state, token: getPreparedToken(plan) };
      // Persist the frozen cutoff before the first irreversible request.
      saveState(key, { ...state, phase: "running", error: null });
    }
    const token = state.token;
    if (!token) throw new Error("Missing chat history purge token");
    while (!signal.aborted) {
      deletionStarted = true;
      const response =
        await commonApiDeleteWithResponse<ApiDeleteMyWaveChatHistoryResponse>({
          endpoint: `${endpoint}?${new URLSearchParams({ purge_token: token })}`,
          signal,
        });
      signal.throwIfAborted();
      validateBatch(response);
      state = {
        ...state,
        deletedCount: state.deletedCount + response.deleted_drop_ids.length,
      };
      saveState(key, { ...state, phase: "running", error: null });
      onBatch(response.deleted_drop_ids);
      if (!response.has_more) {
        state = { ...state, phase: "complete", token: null, error: null };
        saveState(key, state);
        break;
      }
    }
    signal.throwIfAborted();
  } catch (error) {
    state = { ...state, phase: "paused", error: signal.aborted ? null : error };
    saveState(key, state);
  } finally {
    if (deletionStarted)
      onSettled(state.phase === "complete", state.deletedCount);
  }
}
