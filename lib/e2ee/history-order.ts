import type { StoredMessage } from "./records";

/** IndexedDB-safe total order, shared by disk paging and the UI. */
export type HistoryKey = [number, number, number, string];
export function historyKey(
  message: Pick<StoredMessage, "pending" | "ts" | "seq" | "kind" | "id">
): HistoryKey {
  return [
    message.pending ? 1 : 0,
    message.pending ? message.ts : message.seq,
    message.kind === "notice" ? 0 : 1,
    message.id,
  ];
}
export function compareHistory(a: StoredMessage, b: StoredMessage): number {
  const left = historyKey(a);
  const right = historyKey(b);
  let idOrder = 0;
  if (left[3] !== right[3]) idOrder = left[3] < right[3] ? -1 : 1;
  return (
    left[0] - right[0] || left[1] - right[1] || left[2] - right[2] || idOrder
  );
}
export interface HistoryPageOptions {
  before?: HistoryKey;
  after?: HistoryKey;
  limit?: number;
}
export interface HistorySummary {
  tail?: StoredMessage | null;
  last: StoredMessage | null;
  /** Latest sequenced, non-imported incoming message, independent of the UI window. */
  lastIncomingSeq?: number;
  unread: number;
  mentions: number;
  count: number;
  maxSeq: number;
}
export const emptyHistorySummary = (): HistorySummary => ({
  last: null,
  tail: null,
  unread: 0,
  mentions: 0,
  count: 0,
  maxSeq: 0,
});
export const isUnread = (
  message: StoredMessage,
  profileId: string,
  readSeq: number
): boolean =>
  message.kind === "message" &&
  !message.pending &&
  !message.deleted &&
  message.senderProfileId !== profileId &&
  message.seq > readSeq;
