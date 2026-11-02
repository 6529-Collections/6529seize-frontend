import { historyKey, type HistoryKey } from "../history-order";
import type { StoredMessage } from "../records";
import type { EngineContext } from "./context";
import { searchMessages } from "./messages";

/** Scan saved records without retaining them; overlay the bounded in-flight changes. */
export async function searchHistory(
  ctx: EngineContext,
  query: string,
  groups: readonly string[],
  signal?: AbortSignal
): Promise<StoredMessage[]> {
  const overlays = new Map(
    groups.map((g) => {
      const runtime = ctx.store.groups.get(g);
      const replaced = new Set([
        ...(runtime?.dirty ?? []),
        ...(runtime?.deleted ?? []),
      ]);
      const messages = new Map<string, StoredMessage>();
      for (const id of runtime?.dirty ?? []) {
        const message = runtime?.messages.get(id);
        if (message && !runtime?.deleted.has(id))
          messages.set(id, structuredClone(message));
      }
      return [g, { replaced, messages }] as const;
    })
  );
  const results: StoredMessage[] = [];
  for (const group of groups) {
    const overlay = overlays.get(group)!;
    results.push(...searchMessages([overlay], query));
    let after: HistoryKey = [0, Number.NEGATIVE_INFINITY, 0, ""];
    for (;;) {
      signal?.throwIfAborted();
      const rows = await ctx.storage.pageMessages(ctx.profileId, group, {
        after,
        limit: 200,
      });
      signal?.throwIfAborted();
      if (!rows.length) break;
      const messages = new Map(
        rows
          .filter((message) => !overlay.replaced.has(message.id))
          .map((message) => [message.id, message])
      );
      results.push(...searchMessages([{ messages }], query));
      after = historyKey(rows.at(-1)!);
    }
  }
  signal?.throwIfAborted();
  return results.sort((a, b) => b.serverTs - a.serverTs || b.seq - a.seq);
}
