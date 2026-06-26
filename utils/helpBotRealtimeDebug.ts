const HELP_BOT_HANDLE = "help6529";
const HELP_BOT_REALTIME_DEBUG_MARKER = "HELP6529_WS_DEBUG";

interface HelpBotDebugMentionedUser {
  readonly handle_in_content?: string | null;
  readonly current_handle?: string | null;
}

export interface HelpBotDebugDropLike {
  readonly id?: string | null;
  readonly drop_type?: unknown;
  readonly type?: unknown;
  readonly serial_no?: unknown;
  readonly author?: { readonly handle?: string | null } | null;
  readonly mentioned_users?: readonly HelpBotDebugMentionedUser[] | null;
  readonly reply_to?: { readonly drop_id?: string | null } | null;
  readonly wave?: { readonly id?: string | null } | null;
}

const normalizeHandle = (handle: string | null | undefined): string =>
  handle?.replace(/^@/, "").trim().toLowerCase() ?? "";

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
  normalizeHandle(drop.author?.handle) === HELP_BOT_HANDLE ||
  hasHelpBotMention(drop);

export const getHelpBotRealtimeDebugSummary = (drop: HelpBotDebugDropLike) => ({
  authorHandle: drop.author?.handle ?? null,
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

export const logHelpBotRealtimeDebug = (
  event: string,
  details: Record<string, unknown>
): void => {
  // TODO: remove after debugging helpbot reply websocket delivery.
  console.warn(`${HELP_BOT_REALTIME_DEBUG_MARKER} ${event}`, details);
};
