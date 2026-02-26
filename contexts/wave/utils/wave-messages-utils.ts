import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropId } from "@/generated/models/ApiDropId";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import { ApiDropSearchStrategy } from "@/generated/models/ObjectSerializer";
import type { Drop } from "@/helpers/waves/drop.helpers";
import { DropSize, getStableDropKey } from "@/helpers/waves/drop.helpers";
import {
  commonApiFetch,
  commonApiFetchWithRetry,
} from "@/services/api/common-api";

import type { WaveMessagesUpdate } from "../hooks/types";

/**
 * Fetches wave messages (drops) for a specific wave
 * @param waveId The ID of the wave to fetch messages for
 * @param serialNo Optional serial number to fetch messages before (for pagination)
 * @param signal Optional AbortSignal for cancellation
 * @param updateEligibility Optional function to update wave eligibility in centralized store
 * @returns Array of ApiDrop with wave data attached, or null if the request fails
 */
export async function fetchWaveMessages(
  waveId: string,
  serialNo: number | null,
  signal?: AbortSignal,
  updateEligibility?: (waveId: string, eligibility: any) => void
): Promise<ApiDrop[] | null> {
  const params: Record<string, string> = {
    limit: WAVE_DROPS_PARAMS.limit.toString(),
  };
  if (serialNo) {
    params["serial_no_less_than"] = `${serialNo}`;
  }

  try {
    const data = await commonApiFetch<ApiWaveDropsFeed>({
      endpoint: `waves/${waveId}/drops`,
      params,
      signal,
    });

    // Update centralized eligibility if callback provided
    if (updateEligibility && data.wave) {
      updateEligibility(waveId, {
        authenticated_user_eligible_to_chat:
          data.wave.authenticated_user_eligible_to_chat,
        authenticated_user_eligible_to_vote:
          data.wave.authenticated_user_eligible_to_vote,
        authenticated_user_eligible_to_participate:
          data.wave.authenticated_user_eligible_to_participate,
        authenticated_user_admin: data.wave.authenticated_user_admin,
      });
    }

    return data.drops.map((drop) => ({
      ...drop,
      wave: data.wave,
    }));
  } catch (error) {
    // Check if this is an abort error
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // Re-throw abort errors to be handled by the caller
    }

    console.error(
      `[WaveDataManager] Failed to fetch messages for ${waveId}:`,
      error
    );
    return null;
  }
}

export async function fetchAroundSerialNoWaveMessages(
  waveId: string,
  serialNo: number,
  signal?: AbortSignal
): Promise<ApiDrop[] | null> {
  const params: Record<string, string> = {
    limit: WAVE_DROPS_PARAMS.limit.toString(),
  };

  params["search_strategy"] = ApiDropSearchStrategy.Both;
  params["serial_no_limit"] = `${serialNo}`;

  try {
    const data = await commonApiFetchWithRetry<ApiWaveDropsFeed>({
      endpoint: `waves/${waveId}/drops`,
      params,
      signal,
      retryOptions: {
        maxRetries: 2,
        initialDelayMs: 300,
        backoffFactor: 1.5,
        jitter: 0.1,
      },
    });

    return data.drops.map((drop) => ({
      ...drop,
      wave: data.wave,
    }));
  } catch (error) {
    // Check if this is an abort error
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // Re-throw abort errors to be handled by the caller
    }

    console.error(
      `[WaveDataManager] Failed to fetch messages for ${waveId}:`,
      error
    );
    return null;
  }
}

/**
 * Fetches light wave messages (drop ids) for a specific wave
 * @param waveId The ID of the wave to fetch messages for
 * @param oldestSerialNo Unused with drop-ids paging (kept for interface compatibility)
 * @param targetSerialNo The serial number to scroll to
 * @param signal Optional AbortSignal for cancellation
 * @returns Array of drop ids and full drops around the target, or null if the request fails
 */
export async function fetchLightWaveMessages(
  waveId: string,
  oldestSerialNo: number,
  targetSerialNo: number,
  signal?: AbortSignal
): Promise<(ApiDropId | ApiDrop)[] | null> {
  void oldestSerialNo;
  const params: DropIdsApiParams = {
    wave_id: waveId,
    min_serial_no: targetSerialNo,
    limit: DROP_IDS_PAGE_LIMIT,
  };

  try {
    const results = await Promise.all([
      findDropIdsBySerialNoWithPagination(targetSerialNo, params, signal),
      fetchAroundSerialNoWaveMessages(waveId, targetSerialNo, signal),
    ]);

    const combined: (ApiDropId | ApiDrop)[] = [];

    for (const drop of results[0]) {
      combined.push(drop);
    }
    if (results[1]) {
      for (const drop of results[1]) {
        const existingIndex = combined.findIndex(
          (d) => d.serial_no === drop.serial_no
        );
        if (existingIndex !== -1) {
          combined[existingIndex] = drop;
        } else {
          combined.push(drop);
        }
      }
    }

    return combined;
  } catch (error) {
    // Check if this is an abort error
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // Re-throw abort errors to be handled by the caller
    }

    console.error(
      `[WaveDataManager] Failed to fetch light messages for ${waveId}:`,
      error
    );
    return null;
  }
}

/**
 * Transforms API drops into the format needed for the WaveMessages store
 * @param waveId ID of the wave
 * @param drops Array of drops to transform
 * @param options Additional options for formatting
 * @returns Formatted WaveMessages object
 */
export function formatWaveMessages(
  waveId: string,
  drops: ApiDrop[],
  options: {
    isLoading?: boolean | undefined;
    isLoadingNextPage?: boolean | undefined;
    hasNextPage?: boolean | undefined;
  } = {}
): WaveMessagesUpdate {
  const {
    isLoading = false,
    isLoadingNextPage = false,
    hasNextPage = true,
  } = options;

  // Calculate the highest serial number from the fetched drops
  const latestFetchedSerialNo =
    drops.length > 0 ? Math.max(...drops.map((drop) => drop.serial_no)) : null;

  const update: WaveMessagesUpdate = {
    key: waveId,
    id: waveId,
    isLoading,
    isLoadingNextPage,
    hasNextPage: hasNextPage,
    drops: drops.map((drop) => ({
      ...drop,
      type: DropSize.FULL,
      stableKey: drop.id,
      stableHash: drop.id,
    })),
    latestFetchedSerialNo,
  };

  return update;
}

/**
 * Creates an empty wave message store entry
 * @param waveId ID of the wave
 * @param options Additional options for the empty state
 * @returns Empty WaveMessages object
 */
export function createEmptyWaveMessages(
  waveId: string,
  options: {
    isLoading?: boolean | undefined;
    isLoadingNextPage?: boolean | undefined;
    hasNextPage?: boolean | undefined;
  } = {}
): WaveMessagesUpdate {
  const {
    isLoading = false,
    isLoadingNextPage = false,
    hasNextPage = false,
  } = options;

  return {
    key: waveId,
    id: waveId,
    isLoading,
    isLoadingNextPage,
    hasNextPage,
    drops: [],
  };
}

/**
 * Merges two arrays of drops, removing duplicates based on id,
 * preferring newer versions of duplicates, and sorting by serial_no
 *
 * @param currentDrops Current array of drops
 * @param newDrops New array of drops to merge in
 * @returns A new merged array with no duplicates, sorted by serial_no
 */
export function mergeDrops(currentDrops: Drop[], newDrops: Drop[]): Drop[] {
  // Create a map for fast lookup by id
  const dropsMapStableKey = new Map<string, Drop>();

  const newDropsWithStableKey = newDrops.map((drop) => {
    const { key, hash } = getStableDropKey(drop, currentDrops);

    return {
      ...drop,
      stableHash: hash,
      stableKey: key,
    };
  });

  for (const drop of currentDrops) {
    dropsMapStableKey.set(drop.stableKey, drop);
  }

  // Then add all new drops, overwriting any duplicates
  // This ensures we keep the newest version of each drop
  for (const drop of newDropsWithStableKey) {
    dropsMapStableKey.set(drop.stableKey, drop);
  }

  // Convert the map back to an array
  const mergedDrops = Array.from(dropsMapStableKey.values());

  const dropsMapSerialNo = new Map<number, Drop>();

  for (const drop of mergedDrops) {
    dropsMapSerialNo.set(drop.serial_no, drop);
  }

  const finalDrops = Array.from(dropsMapSerialNo.values());

  finalDrops.sort((a, b) => {
    if (a.type === DropSize.LIGHT || b.type === DropSize.LIGHT) {
      return b.serial_no - a.serial_no;
    }

    const aIsTemp = a.id?.startsWith("temp-") ?? false;
    const bIsTemp = b.id?.startsWith("temp-") ?? false;

    if (aIsTemp || !bIsTemp) {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return b.serial_no - a.serial_no;
  });

  return finalDrops;
}

// Helper function to get the highest serial number from an array of drops
function getHighestSerialNo(drops: ApiDrop[] | Drop[]): number | null {
  if (!drops || drops.length === 0) {
    return null;
  }
  return Math.max(...drops.map((drop) => drop.serial_no));
}

/**
 * Fetches wave messages (drops) newer than a specific serial number for a wave
 * @param waveId The ID of the wave to fetch messages for
 * @param sinceSerialNo Fetch messages with serial_no strictly greater than this. If null, fetches latest.
 * @param limit The maximum number of messages to fetch.
 * @param signal Optional AbortSignal for cancellation
 * @returns Object containing fetched drops and the highest serial number among them, or nulls on error.
 */
export async function fetchNewestWaveMessages(
  waveId: string,
  sinceSerialNo: number | null,
  limit: number,
  signal?: AbortSignal,
  updateEligibility?: (waveId: string, eligibility: any) => void
): Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }> {
  const params: Record<string, string> = {
    limit: limit.toString(),
  };
  if (sinceSerialNo !== null) {
    // Assuming API uses these parameters for fetching newer messages
    params["serial_no_limit"] = `${sinceSerialNo}`;
    params["search_strategy"] = ApiDropSearchStrategy.Newer;
  }

  try {
    const data = await commonApiFetchWithRetry<ApiWaveDropsFeed>({
      endpoint: `waves/${waveId}/drops`,
      params,
      signal,
      retryOptions: {
        maxRetries: 2,
        initialDelayMs: 300,
        backoffFactor: 1.5,
        jitter: 0.1,
      },
    });

    // Update centralized eligibility if callback provided
    if (updateEligibility && data.wave) {
      updateEligibility(waveId, {
        authenticated_user_eligible_to_chat:
          data.wave.authenticated_user_eligible_to_chat,
        authenticated_user_eligible_to_vote:
          data.wave.authenticated_user_eligible_to_vote,
        authenticated_user_eligible_to_participate:
          data.wave.authenticated_user_eligible_to_participate,
        authenticated_user_admin: data.wave.authenticated_user_admin,
      });
    }

    const fetchedDrops = data.drops.map((drop) => ({
      ...drop,
      wave: data.wave,
    }));

    const highestSerialNo = getHighestSerialNo(fetchedDrops);

    return { drops: fetchedDrops, highestSerialNo };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn(`[Utils] Fetch newest for ${waveId} aborted.`);
      throw error; // Re-throw abort errors
    }
    console.error(
      `[Utils] Error fetching newest messages for ${waveId}:`,
      error
    );
    return { drops: null, highestSerialNo: null }; // Return nulls on other errors
  }
}

export const maxOrNull = (
  a: number | null | undefined,
  b: number | null | undefined
): number | null => {
  // this signature "x is number" tells TS that inside `filter` we only keep numbers
  const nums = [a, b].filter(
    (x): x is number => typeof x === "number" && Number.isFinite(x)
  );

  return nums.length > 0 ? Math.max(...nums) : null;
};

const DROP_IDS_PAGE_LIMIT = 5000;

/**
 * Parameters for the /drop-ids API endpoint.
 */
interface DropIdsApiParams {
  /** The ID of the wave to fetch messages for. Required by the API. */
  wave_id: string;
  /** Fetch items with serial_no greater than or equal to this value. Required. */
  min_serial_no: number;
  /** Fetch items with serial_no less than or equal to this value. Optional. */
  max_serial_no?: number | undefined;
  /** The maximum number of items to return. API requires 1-5000. Defaults to 5000 if not specified by caller. */
  limit?: number | undefined;
  // Add any other specific, known query parameters for /drop-ids from openapi.yaml if they exist
}

async function findDropIdsBySerialNoWithPagination(
  targetSerialNo: number,
  apiParams: DropIdsApiParams,
  signal?: AbortSignal
): Promise<ApiDropId[]> {
  let currentMaxSerialForNextCall: number | null =
    apiParams.max_serial_no ?? null;
  let requestsMade = 0;
  const MAX_REQUESTS = 20;

  const allFetchedDropsMap = new Map<number, ApiDropId>(); // Used to store unique drops by serial_no
  let targetFound = false;

  if (!apiParams.wave_id) {
    throw new Error("wave_id is required in apiParams");
  }
  if (!apiParams.min_serial_no) {
    throw new Error("min_serial_no is required in apiParams");
  }

  const itemsPerRequest =
    typeof apiParams.limit === "number" &&
    apiParams.limit > 0 &&
    apiParams.limit <= DROP_IDS_PAGE_LIMIT
      ? apiParams.limit
      : DROP_IDS_PAGE_LIMIT;

  while (requestsMade < MAX_REQUESTS && !targetFound) {
    requestsMade++;

    const paramsForCurrentRequest: Record<string, string> = {
      wave_id: apiParams.wave_id,
      min_serial_no: apiParams.min_serial_no.toString(),
      limit: itemsPerRequest.toString(),
    };

    if (currentMaxSerialForNextCall !== null) {
      paramsForCurrentRequest["max_serial_no"] =
        currentMaxSerialForNextCall.toString();
    }

    const currentBatch = await commonApiFetchWithRetry<ApiDropId[]>({
      endpoint: `drop-ids`,
      params: paramsForCurrentRequest,
      signal,
      retryOptions: {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffFactor: 2,
        jitter: 0.1,
      },
    });

    if (signal?.aborted) {
      throw new Error("Request aborted by signal.");
    }

    if (!currentBatch || currentBatch.length === 0) {
      if (!targetFound) {
        // Only throw if target hasn't been found in a previous batch that was processed before an empty one
        const maxSerialLabel = currentMaxSerialForNextCall ?? "newest";
        const message = `Target serial number ${targetSerialNo} not found. No (more) items match criteria with wave_id=${apiParams.wave_id} and max_serial_no=${maxSerialLabel}.`;
        throw new Error(message);
      }
      break; // Target was found, and now we got an empty batch, so we are done.
    }

    let smallestSerialInCurrentBatch = currentBatch[0]?.serial_no ?? null;
    for (const drop of currentBatch) {
      if (!allFetchedDropsMap.has(drop.serial_no)) {
        allFetchedDropsMap.set(drop.serial_no, drop);
      }
      if (drop.serial_no === targetSerialNo) {
        targetFound = true;
      }
      if (
        smallestSerialInCurrentBatch === null ||
        drop.serial_no < smallestSerialInCurrentBatch
      ) {
        smallestSerialInCurrentBatch = drop.serial_no;
      }
    }

    if (targetFound) {
      // If target is found, we have processed its batch. We can break and return relevant drops.
      break;
    }

    if (smallestSerialInCurrentBatch === null) {
      break;
    }

    // Prepare for next iteration or check if we should stop
    if (
      currentBatch.length < itemsPerRequest &&
      smallestSerialInCurrentBatch > targetSerialNo
    ) {
      // Last page fetched, it was smaller than limit, and the smallest item is still greater than target.
      // This means target is not in the dataset in the range we are looking.
      break; // Target not found, and no more data in the desired direction.
    }

    // Avoid infinite loops if the API returns the same lowest serial repeatedly.
    if (
      currentMaxSerialForNextCall !== null &&
      smallestSerialInCurrentBatch >= currentMaxSerialForNextCall &&
      currentBatch.length === itemsPerRequest
    ) {
      break;
    }

    currentMaxSerialForNextCall = smallestSerialInCurrentBatch;

    if (currentMaxSerialForNextCall < targetSerialNo) {
      // We've passed the target serial number range in pagination without finding it.
      break;
    }
  }

  if (!targetFound) {
    throw new Error(
      `Target serial number ${targetSerialNo} not found for wave_id=${
        apiParams.wave_id
      } after ${requestsMade} requests (checked up to ${
        requestsMade * itemsPerRequest
      } items).`
    );
  }

  const finalDrops = Array.from(allFetchedDropsMap.values()).sort(
    (a, b) => b.serial_no - a.serial_no
  ); // Sort descending by serial_no

  return finalDrops;
}
