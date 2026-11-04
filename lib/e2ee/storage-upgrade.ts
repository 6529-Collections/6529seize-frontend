import {
  compareHistory,
  emptyHistorySummary,
  isUnread,
  type HistorySummary,
} from "./history-order";
import type { StoredGroup, StoredMessage } from "./records";

type ProfileMessage = StoredMessage & { profileId: string };
type ProfileGroup = StoredGroup & { profileId: string };
interface GroupSummary {
  group: ProfileGroup;
  history: HistorySummary;
}
const keyFor = (profileId: string, g: string) => JSON.stringify([profileId, g]);
// Read at most 1,000 records at a time rather than hydrating the full history.
const UPGRADE_READ_BATCH_SIZE = 1_000;

function accumulate(
  entry: GroupSummary,
  message: ProfileMessage,
  plain: (row: ProfileMessage) => StoredMessage
): void {
  const { history, group } = entry;
  history.count++;
  const unread = isUnread(message, message.profileId, group.readSeq);
  history.unread += Number(unread);
  history.mentions += Number(
    unread && message.mentions.includes(message.profileId)
  );
  if (message.pending) return;
  history.maxSeq = Math.max(history.maxSeq, message.seq);
  if (!history.tail || compareHistory(history.tail, message) < 0)
    history.tail = plain(message);
  if (
    message.kind === "message" &&
    (!history.last || compareHistory(history.last, message) < 0)
  )
    history.last = plain(message);
}

/** One versionchange transaction; bounded reads avoid one JS cursor event per record. */
export function backfillHistory(
  messages: IDBObjectStore,
  groups: IDBObjectStore,
  indexed: (profileId: string, message: StoredMessage) => unknown,
  plain: (row: ProfileMessage) => StoredMessage,
  complete: () => void
): void {
  // Request errors deliberately abort the whole upgrade; v1 remains intact for retry.
  const readGroups = groups.getAll() as IDBRequest<ProfileGroup[]>;
  readGroups.onsuccess = () => {
    const summaries = new Map(
      readGroups.result.map((group) => [
        keyFor(group.profileId, group.g),
        { group, history: emptyHistorySummary() },
      ])
    );
    const next = (after?: IDBValidKey) => {
      const range =
        after === undefined ? undefined : IDBKeyRange.lowerBound(after, true);
      const read = messages.getAll(
        range,
        UPGRADE_READ_BATCH_SIZE
      ) as IDBRequest<ProfileMessage[]>;
      read.onsuccess = () => {
        const rows = read.result;
        if (!rows.length) {
          for (const { group, history } of summaries.values())
            groups.put({ ...group, history });
          complete();
          return;
        }
        for (const row of rows) {
          const summary = summaries.get(keyFor(row.profileId, row.g));
          if (summary) accumulate(summary, row, plain);
          messages.put(indexed(row.profileId, row));
        }
        const last = rows.at(-1)!;
        next([last.profileId, last.g, last.id]);
      };
    };
    next();
  };
}
