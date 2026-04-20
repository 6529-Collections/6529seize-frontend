"use client";

const STORAGE_KEY = "emoji-reaction-debug";
const URL_FLAG = "emojiReactionDebug";
const LOG_PREFIX = "[emoji-reaction-debug]";

export type EmojiReactionDebugSource =
  | "picker_desktop"
  | "picker_mobile"
  | "quick_desktop"
  | "quick_mobile"
  | "existing_chip"
  | "unknown";

export type EmojiReactionDebugMeta = {
  readonly attemptId?: string | undefined;
  readonly source?: EmojiReactionDebugSource | undefined;
};

type EmojiReactionDebugEvent =
  | "debug_enabled"
  | "click"
  | "optimistic_applied"
  | "request_start"
  | "request_success"
  | "request_error"
  | "rollback"
  | "ws_reaction_update_received"
  | "drop_refetch_start"
  | "drop_refetch_success"
  | "store_reaction_change";

type EmojiReactionDebugSettings = {
  readonly enabled: boolean;
  readonly enabledAt: number;
  readonly sessionId: string;
};

type ReactionProfile = {
  readonly id?: string | null | undefined;
};

type ReactionEntry = {
  readonly reaction: string;
  readonly profiles: readonly ReactionProfile[];
};

type ReactionDebugDrop = {
  readonly id?: string | undefined;
  readonly context_profile_context?:
    | {
        readonly reaction?: string | null | undefined;
      }
    | null
    | undefined;
  readonly reactions?: readonly ReactionEntry[] | null | undefined;
};

const isBrowser = (): boolean => typeof window !== "undefined";

const readStorageValue = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStorageValue = (value: EmojiReactionDebugSettings): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Debug logging must never affect the reaction flow.
  }
};

const readSettings = (): EmojiReactionDebugSettings | null => {
  const value = readStorageValue();
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    if (record["enabled"] !== true) {
      return null;
    }

    const enabledAt =
      typeof record["enabledAt"] === "number" ? record["enabledAt"] : 0;
    const sessionId =
      typeof record["sessionId"] === "string" && record["sessionId"].length > 0
        ? record["sessionId"]
        : createDebugId("session");

    return { enabled: true, enabledAt, sessionId };
  } catch {
    return null;
  }
};

const createDebugId = (prefix: string): string => {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  const random =
    cryptoApi && typeof cryptoApi.randomUUID === "function"
      ? cryptoApi.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${random}`;
};

export const createEmojiReactionAttemptId = (): string =>
  createDebugId("attempt");

export const enableEmojiReactionDebugFromUrl = (): void => {
  if (!isBrowser()) {
    return;
  }

  const search = window.location.search;
  if (!search) {
    return;
  }

  const params = new URLSearchParams(search);
  if (params.get(URL_FLAG) !== "1") {
    return;
  }

  const previousSettings = readSettings();
  const settings: EmojiReactionDebugSettings = {
    enabled: true,
    enabledAt: Date.now(),
    sessionId: previousSettings?.sessionId ?? createDebugId("session"),
  };

  writeStorageValue(settings);
  logEmojiReactionDebug("debug_enabled", {
    reason: "url_flag",
  });
};

export const getEmojiReactionDebugValueShape = (value: unknown): string => {
  if (value === undefined) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `array:${value.length}`;
  }
  if (typeof value === "object") {
    return `object:${Object.keys(value).sort().join(",")}`;
  }
  return typeof value;
};

export const getEmojiReactionDebugError = (
  error: unknown
): Record<string, unknown> => {
  if (typeof error === "string") {
    return {
      error_type: "string",
      error_message: error,
    };
  }

  if (error instanceof Error) {
    const errorRecord = error as Error & {
      readonly status?: unknown;
      readonly response?: { readonly status?: unknown } | undefined;
    };

    return {
      error_type: error.name,
      error_message: error.message,
      status_code:
        typeof errorRecord.status === "number"
          ? errorRecord.status
          : errorRecord.response?.status,
    };
  }

  return {
    error_type: typeof error,
    error_message: String(error),
  };
};

export const buildEmojiReactionDebugState = (
  drop: ReactionDebugDrop | null | undefined,
  profileId?: string | null
): Record<string, unknown> => {
  const reactions = drop?.reactions ?? [];

  return {
    context_reaction: drop?.context_profile_context?.reaction ?? null,
    reaction_counts: reactions.map((reaction) => ({
      reaction: reaction.reaction,
      count: reaction.profiles.length,
      profile_present: profileId
        ? reaction.profiles.some((profile) => profile.id === profileId)
        : undefined,
    })),
  };
};

export const logEmojiReactionDebug = (
  event: EmojiReactionDebugEvent,
  data: Record<string, unknown> = {}
): void => {
  const settings = readSettings();
  if (!settings?.enabled) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    event,
    sessionId: settings.sessionId,
    attemptId: data["attemptId"] ?? null,
    profileId: data["profileId"] ?? null,
    ...data,
  };

  console.warn(LOG_PREFIX, payload);
};
