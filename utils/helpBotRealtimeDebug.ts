import type { ApiDrop } from "@/generated/models/ApiDrop";

const HELP_BOT_HANDLE = "help6529";
const HELP_BOT_REALTIME_DEBUG_MARKER = "HELP6529_WS_DEBUG";

const normalizeHandle = (handle: string | null | undefined): string =>
  handle?.replace(/^@/, "").trim().toLowerCase() ?? "";

const hasHelpBotMention = (drop: ApiDrop): boolean =>
  (drop.mentioned_users ?? []).some((user) => {
    return (
      normalizeHandle(user.handle_in_content) === HELP_BOT_HANDLE ||
      normalizeHandle(user.current_handle) === HELP_BOT_HANDLE
    );
  });

export const isHelpBotRealtimeDebugDrop = (drop: ApiDrop): boolean =>
  normalizeHandle(drop.author.handle) === HELP_BOT_HANDLE ||
  hasHelpBotMention(drop);

export const getHelpBotRealtimeDebugSummary = (drop: ApiDrop) => ({
  authorHandle: drop.author.handle,
  dropId: drop.id,
  dropType: drop.drop_type,
  replyToDropId: drop.reply_to?.drop_id ?? null,
  serialNo: drop.serial_no,
  waveId: drop.wave.id,
});

export const logHelpBotRealtimeDebug = (
  event: string,
  details: Record<string, unknown>
): void => {
  // TODO: remove after debugging helpbot reply websocket delivery.
  console.warn(`${HELP_BOT_REALTIME_DEBUG_MARKER} ${event}`, details);
};
