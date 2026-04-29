import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";

const DROP_BATCH_SIZE = 20;

export const DROP_DETAIL_STALE_TIME_MS = 60 * 1000;
export const DROP_BATCH_STALE_TIME_MS = 5 * 60 * 1000;

export const getDropQueryKey = (dropId: string | null | undefined) =>
  [
    QueryKey.DROP,
    {
      drop_id: dropId ?? null,
    },
  ] as const;

const getUniqueDropIds = (dropIds: readonly string[]): string[] => {
  const uniqueDropIds: string[] = [];
  const seenDropIds = new Set<string>();

  for (const dropId of dropIds) {
    const normalizedDropId = dropId.trim();
    if (!normalizedDropId || seenDropIds.has(normalizedDropId)) {
      continue;
    }
    seenDropIds.add(normalizedDropId);
    uniqueDropIds.push(normalizedDropId);
  }

  return uniqueDropIds;
};

const chunkDropIds = (dropIds: readonly string[]): string[][] => {
  const chunks: string[][] = [];
  for (let index = 0; index < dropIds.length; index += DROP_BATCH_SIZE) {
    chunks.push(dropIds.slice(index, index + DROP_BATCH_SIZE));
  }
  return chunks;
};

export const orderDropsByIds = (
  dropIds: readonly string[],
  drops: readonly ApiDrop[]
): ApiDrop[] => {
  const dropsById = new Map(drops.map((drop) => [drop.id, drop]));
  return getUniqueDropIds(dropIds)
    .map((dropId) => dropsById.get(dropId))
    .filter((drop): drop is ApiDrop => !!drop);
};

export const fetchDropsByIds = async (
  dropIds: readonly string[]
): Promise<ApiDrop[]> => {
  const uniqueDropIds = getUniqueDropIds(dropIds);
  if (uniqueDropIds.length === 0) {
    return [];
  }

  const dropChunks = chunkDropIds(uniqueDropIds);
  const dropPages = await Promise.all(
    dropChunks.map((chunk) =>
      commonApiFetch<ApiDrop[]>({
        endpoint: "drops",
        params: {
          ids: chunk.join(","),
          limit: `${chunk.length}`,
          include_replies: "true",
        },
      })
    )
  );

  return orderDropsByIds(uniqueDropIds, dropPages.flat());
};

export const seedDropCache = (
  queryClient: QueryClient,
  drops: readonly ApiDrop[]
) => {
  for (const drop of drops) {
    queryClient.setQueryData<ApiDrop>(getDropQueryKey(drop.id), drop);
  }
};

type PendingDropRequest = {
  readonly resolve: (drop: ApiDrop) => void;
  readonly reject: (error: unknown) => void;
};

let pendingDropRequests = new Map<string, PendingDropRequest[]>();
let isDropBatchScheduled = false;

const flushPendingDropRequests = async () => {
  const currentRequests = pendingDropRequests;
  pendingDropRequests = new Map();
  isDropBatchScheduled = false;

  const dropIds = [...currentRequests.keys()];

  try {
    const drops = await fetchDropsByIds(dropIds);
    const dropsById = new Map(drops.map((drop) => [drop.id, drop]));

    for (const dropId of dropIds) {
      const drop = dropsById.get(dropId);
      const requests = currentRequests.get(dropId) ?? [];
      if (!drop) {
        const error = new Error(`Drop ${dropId} not found`);
        requests.forEach((request) => request.reject(error));
        continue;
      }
      requests.forEach((request) => request.resolve(drop));
    }
  } catch (error) {
    currentRequests.forEach((requests) => {
      requests.forEach((request) => request.reject(error));
    });
  }
};

const scheduleDropBatchFlush = () => {
  if (isDropBatchScheduled) {
    return;
  }

  isDropBatchScheduled = true;
  setTimeout(() => {
    void flushPendingDropRequests();
  }, 0);
};

export const fetchDropByIdBatched = (dropId: string): Promise<ApiDrop> =>
  new Promise((resolve, reject) => {
    const normalizedDropId = dropId.trim();
    if (!normalizedDropId) {
      reject(new Error("Cannot fetch drop without a drop id"));
      return;
    }

    const requests = pendingDropRequests.get(normalizedDropId) ?? [];
    pendingDropRequests.set(normalizedDropId, [
      ...requests,
      { resolve, reject },
    ]);
    scheduleDropBatchFlush();
  });
