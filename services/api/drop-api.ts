import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";

export const DROP_DETAIL_STALE_TIME_MS = 60 * 1000;
export const DROP_BATCH_STALE_TIME_MS = 5 * 60 * 1000;
const DROP_IDS_BATCH_SIZE = 100;

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

  for (let i = 0; i < dropIds.length; i += DROP_IDS_BATCH_SIZE) {
    chunks.push(dropIds.slice(i, i + DROP_IDS_BATCH_SIZE));
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

type DropFetchResult =
  | {
      readonly dropId: string;
      readonly status: "fulfilled";
      readonly drop: ApiDrop;
    }
  | {
      readonly dropId: string;
      readonly status: "rejected";
      readonly error: unknown;
    };

type FulfilledDropFetchResult = Extract<
  DropFetchResult,
  { readonly status: "fulfilled" }
>;

const fetchDropResultsByIds = async (
  dropIds: readonly string[]
): Promise<DropFetchResult[]> => {
  const uniqueDropIds = getUniqueDropIds(dropIds);
  if (uniqueDropIds.length === 0) {
    return [];
  }

  const chunks = chunkDropIds(uniqueDropIds);
  const chunkResults = await Promise.allSettled(
    chunks.map((chunk) =>
      fetchDropsV2ByIds({
        dropIds: chunk,
        includeFullMetadata: false,
        includeTopRaters: false,
      })
    )
  );

  const results: DropFetchResult[] = [];

  chunkResults.forEach((result, index) => {
    const chunk = chunks[index]!;
    if (result.status === "rejected") {
      results.push(
        ...chunk.map((dropId) => ({
          dropId,
          status: "rejected" as const,
          error: result.reason as unknown,
        }))
      );
      return;
    }

    const dropsById = new Map(result.value.map((drop) => [drop.id, drop]));
    chunk.forEach((dropId) => {
      const drop = dropsById.get(dropId);
      if (!drop) {
        results.push({
          dropId,
          status: "rejected",
          error: new Error(`Drop ${dropId} not found`),
        });
        return;
      }

      results.push({
        dropId,
        status: "fulfilled",
        drop,
      });
    });
  });

  return results;
};

export const fetchDropsByIds = async (
  dropIds: readonly string[]
): Promise<ApiDrop[]> => {
  const results = await fetchDropResultsByIds(dropIds);
  const drops = results
    .filter(
      (result): result is FulfilledDropFetchResult =>
        result.status === "fulfilled"
    )
    .map((result) => result.drop);

  return orderDropsByIds(dropIds, drops);
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
    const results = await fetchDropResultsByIds(dropIds);

    for (const result of results) {
      const requests = currentRequests.get(result.dropId) ?? [];
      if (result.status === "rejected") {
        requests.forEach((request) => request.reject(result.error));
        continue;
      }
      requests.forEach((request) => request.resolve(result.drop));
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
