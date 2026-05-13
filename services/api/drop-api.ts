import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";

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

  const results = await Promise.allSettled(
    uniqueDropIds.map((dropId) =>
      fetchDropV2ById(dropId, undefined, {
        includeFullMetadata: false,
        includeTopRaters: false,
      })
    )
  );

  return results.map((result, index) => {
    const dropId = uniqueDropIds[index]!;
    if (result.status === "fulfilled") {
      return {
        dropId,
        status: "fulfilled",
        drop: result.value,
      };
    }

    return {
      dropId,
      status: "rejected",
      error: result.reason as unknown,
    };
  });
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
