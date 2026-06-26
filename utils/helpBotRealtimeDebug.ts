const HELP_BOT_HANDLE = "help6529";
const HELP_BOT_REALTIME_DEBUG_MARKER = "HELP6529_WS_DEBUG";
const HELP_BOT_REALTIME_DEBUG_STORAGE_KEY = "HELP6529_WS_DEBUG";
const HELP_BOT_REALTIME_DEBUG_QUERY_PARAM = "help6529WsDebug";

interface HelpBotDebugMentionedUser {
  readonly handle_in_content?: string | null | undefined;
  readonly current_handle?: string | null | undefined;
}

interface HelpBotDebugDropLike {
  readonly id?: string | null | undefined;
  readonly drop_type?: unknown;
  readonly type?: unknown;
  readonly serial_no?: unknown;
  readonly author?:
    | string
    | { readonly handle?: string | null | undefined }
    | null
    | undefined;
  readonly mentioned_users?:
    | readonly HelpBotDebugMentionedUser[]
    | null
    | undefined;
  readonly reply_to?:
    | { readonly drop_id?: string | null | undefined }
    | null
    | undefined;
  readonly wave?:
    | { readonly id?: string | null | undefined }
    | null
    | undefined;
}

const normalizeHandle = (handle: string | null | undefined): string =>
  handle?.replace(/^@/, "").trim().toLowerCase() ?? "";

const getAuthorHandle = (
  author: HelpBotDebugDropLike["author"]
): string | null => {
  if (typeof author === "string") {
    return author;
  }

  return author?.handle ?? null;
};

const hasHelpBotMention = (drop: HelpBotDebugDropLike): boolean =>
  (drop.mentioned_users ?? []).some((user) => {
    return (
      normalizeHandle(user.handle_in_content) === HELP_BOT_HANDLE ||
      normalizeHandle(user.current_handle) === HELP_BOT_HANDLE
    );
  });

export const isHelpBotRealtimeDebugDrop = (
  drop: HelpBotDebugDropLike
): boolean =>
  normalizeHandle(getAuthorHandle(drop.author)) === HELP_BOT_HANDLE ||
  hasHelpBotMention(drop);

export const getHelpBotRealtimeDebugSummary = (drop: HelpBotDebugDropLike) => ({
  authorHandle: getAuthorHandle(drop.author),
  dropId: drop.id,
  dropType: drop.drop_type ?? drop.type ?? null,
  replyToDropId: drop.reply_to?.drop_id ?? null,
  serialNo: drop.serial_no,
  serialNoType: typeof drop.serial_no,
  waveId: drop.wave?.id ?? null,
});

export const getHelpBotRealtimeDebugDropsSummary = (
  drops: readonly HelpBotDebugDropLike[]
) => ({
  count: drops.length,
  newest: drops.slice(0, 3).map(getHelpBotRealtimeDebugSummary),
  helpBotDrops: drops
    .filter(isHelpBotRealtimeDebugDrop)
    .slice(0, 5)
    .map(getHelpBotRealtimeDebugSummary),
});

const isHelpBotRealtimeDebugEnabled = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(HELP_BOT_REALTIME_DEBUG_STORAGE_KEY) ===
        "true" ||
      new URLSearchParams(window.location.search).get(
        HELP_BOT_REALTIME_DEBUG_QUERY_PARAM
      ) === "true"
    );
  } catch {
    return false;
  }
};

export const logHelpBotRealtimeDebug = (
  event: string,
  details: Record<string, unknown>
): void => {
  if (!isHelpBotRealtimeDebugEnabled()) {
    return;
  }

  // TODO: remove after debugging helpbot reply websocket delivery.
  console.warn(`${HELP_BOT_REALTIME_DEBUG_MARKER} ${event}`, details);
};
