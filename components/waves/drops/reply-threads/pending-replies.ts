import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import type { ApiWaveDropsV2PageFeed } from "@/services/api/wave-drops-v2-api";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "@/helpers/waves/wave-drops.helpers";
import {
  DropSize,
  type Drop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";

/** Embedded parents identify the original thread without another request. */
function getReplyAncestorIds(drop: ApiDropWithoutWave): string[] {
  const parents = new Set<string>();
  let replyTo = drop.reply_to;
  while (replyTo && !parents.has(replyTo.drop_id)) {
    parents.add(replyTo.drop_id);
    replyTo = replyTo.drop?.reply_to;
  }
  return [...parents];
}

/** Render current query data alongside sends already tracked by the wave stream. */
export function getVisibleThreadReplies({
  pages,
  previous,
  streamDrops,
  parentDropId,
}: {
  readonly pages: (ApiWaveDropsFeed | ApiWaveDropsV2PageFeed)[] | undefined;
  readonly previous: ExtendedDrop[];
  readonly streamDrops: readonly Drop[];
  readonly parentDropId: string;
}): ExtendedDrop[] {
  const localReplies = streamDrops.filter(
    (drop): drop is ExtendedDrop =>
      drop.type === DropSize.FULL &&
      getReplyAncestorIds(drop).includes(parentDropId)
  );
  const history = [...previous, ...localReplies];
  const queried = pages
    ? generateUniqueKeys(mapToExtendedDrops(pages, history), history)
    : previous;
  const merged = new Map(queried.map((drop) => [drop.id, drop]));
  localReplies.forEach((drop) => {
    if (!merged.has(drop.id) || drop.id.startsWith("temp-"))
      merged.set(drop.id, drop);
  });
  const canonicalHashes = new Map<string, number>();
  merged.forEach((drop) => {
    if (!drop.id.startsWith("temp-"))
      canonicalHashes.set(
        drop.stableHash,
        (canonicalHashes.get(drop.stableHash) ?? 0) + 1
      );
  });
  return [...merged.values()]
    .filter((drop) => {
      if (!drop.id.startsWith("temp-")) return true;
      const matches = canonicalHashes.get(drop.stableHash) ?? 0;
      if (matches === 0) return true;
      canonicalHashes.set(drop.stableHash, matches - 1);
      return false;
    })
    .sort((a, b) => a.serial_no - b.serial_no);
}

/** Remove the temporary row on completion; the wave stream owns its lifecycle. */
export function removeTemporaryThreadReply(
  queryClient: QueryClient,
  waveId: string,
  dropId: string
): void {
  queryClient
    .getQueriesData<{
      pages: ApiWaveDropsFeed[];
    }>({
      queryKey: [QueryKey.DROPS, { waveId }],
      predicate: (query) => {
        const params = query.queryKey[1];
        return (
          typeof params === "object" &&
          params !== null &&
          "dropId" in params &&
          typeof params.dropId === "string" &&
          params.dropId.length > 0
        );
      },
    })
    .forEach(([key, data]) => {
      if (
        !data?.pages.some((page) =>
          page.drops.some((drop) => drop.id === dropId)
        )
      )
        return;
      queryClient.setQueryData(key, {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          drops: page.drops.filter((drop) => drop.id !== dropId),
        })),
      });
    });
}
