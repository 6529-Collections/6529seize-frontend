import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropId } from "@/generated/models/ApiDropId";
import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { Drop } from "@/helpers/waves/drop.helpers";
import { DropSize, getStableDropKey } from "@/helpers/waves/drop.helpers";
import { commonApiFetchWithRetry } from "@/services/api/common-api";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";
import type { WaveEligibility } from "../WaveEligibilityContext";
import type { WaveMessagesUpdate } from "../hooks/types";

interface FetchWaveMessagesOptions {
  readonly limit?: number | undefined;
  readonly onFailure?: ((error: unknown) => void) | undefined;
}

type WaveDropsFeedWave = Awaited<
  ReturnType<typeof fetchWaveDropsFeedV2>
>["wave"];

const getWaveEligibilityUpdate = (
  wave: WaveDropsFeedWave | undefined
): Partial<WaveEligibility> | null => {
  if (wave === undefined) {
    return null;
  }

  return {
    authenticated_user_eligible_to_chat:
      wave.authenticated_user_eligible_to_chat,
    authenticated_user_eligible_to_vote:
      wave.authenticated_user_eligible_to_vote,
    authenticated_user_eligible_to_participate:
      wave.authenticated_user_eligible_to_participate,
    authenticated_user_admin: wave.authenticated_user_admin,
  };
};

const updateWaveEligibilityFromFeed = (
  waveId: string,
  wave: WaveDropsFeedWave | undefined,
  updateEligibility:
    | ((waveId: string, eligibility: Partial<WaveEligibility>) => void)
    | undefined
): void => {
  if (updateEligibility === undefined) {
    return;
  }

  const eligibility = getWaveEligibilityUpdate(wave);
  if (eligibility !== null) {
    updateEligibility(waveId, eligibility);
  }
};

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
  updateEligibility?: (
    waveId: string,
    eligibility: Partial<WaveEligibility>
  ) => void,
  options: FetchWaveMessagesOptions = {}
): Promise<ApiDrop[] | null> {
  try {
    const data = await fetchWaveDropsFeedV2({
      waveId,
      limit: options.limit ?? WAVE_DROPS_PARAMS.limit,
      serialNoLimit: serialNo,
      searchStrategy:
        serialNo === null ? undefined : ApiDropSearchStrategy.Older,
      signal,
    });

    updateWaveEligibilityFromFeed(waveId, data.wave, updateEligibility);

    return data.drops as ApiDrop[];
  } catch (error) {
    // Check if this is an abort error
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // Re-throw abort errors to be handled by the caller
    }

    console.error(
      `[WaveDataManager] Failed to fetch messages for ${waveId}:`,
      error
    );
    try {
      options.onFailure?.(error);
    } catch (callbackError) {
      console.error(
        `[WaveDataManager] Failed to report fetch failure for ${waveId}:`,
        callbackError
      );
    }
    return null;
  }
}

export async function fetchAroundSerialNoWaveMessages(
  waveId: string,
  serialNo: number,
  signal?: AbortSignal
): Promise<ApiDrop[] | null> {
  try {
    const data = await fetchWaveDropsFeedV2({
      waveId,
      limit: WAVE_DROPS_PARAMS.limit,
      serialNoLimit: serialNo,
      searchStrategy: ApiDropSearchStrategy.Both,
      signal,
      withRetry: true,
    });

    return data.drops as ApiDrop[];
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

    const createdAtDiff = getDropCreatedAtMillis(b) - getDropCreatedAtMillis(a);
    return createdAtDiff || b.serial_no - a.serial_no;
  });

  return finalDrops;
}

function getDropCreatedAtMillis(drop: Drop): number {
  if (drop.created_at === undefined) {
    return drop.serial_no;
  }

  const timestamp =
    typeof drop.created_at === "number"
      ? drop.created_at
      : new Date(drop.created_at).getTime();

  return Number.isFinite(timestamp) ? timestamp : drop.serial_no;
}

// Helper function to get the highest serial number from an array of drops
function getHighestSerialNo(drops: ApiDrop[] | Drop[]): number | null {
  if (drops.length === 0) {
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
  updateEligibility?: (
    waveId: string,
    eligibility: Partial<WaveEligibility>
  ) => void
): Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }> {
  try {
    const data = await fetchWaveDropsFeedV2({
      waveId,
      limit,
      serialNoLimit: sinceSerialNo,
      searchStrategy:
        sinceSerialNo === null ? undefined : ApiDropSearchStrategy.Newer,
      signal,
      withRetry: true,
    });

    updateWaveEligibilityFromFeed(waveId, data.wave, updateEligibility);

    const fetchedDrops = data.drops as ApiDrop[];

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
const MAX_DROP_IDS_REQUESTS = 20;

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

const getDropIdsPageLimit = (limit?: number): number =>
  typeof limit === "number" && limit > 0 && limit <= DROP_IDS_PAGE_LIMIT
    ? limit
    : DROP_IDS_PAGE_LIMIT;

const buildDropIdsRequestParams = ({
  apiParams,
  currentMaxSerialForNextCall,
  itemsPerRequest,
}: {
  readonly apiParams: DropIdsApiParams;
  readonly currentMaxSerialForNextCall: number | null;
  readonly itemsPerRequest: number;
}): Record<string, string> => {
  const params: Record<string, string> = {
    wave_id: apiParams.wave_id,
    min_serial_no: apiParams.min_serial_no.toString(),
    limit: itemsPerRequest.toString(),
  };

  if (currentMaxSerialForNextCall !== null) {
    params["max_serial_no"] = currentMaxSerialForNextCall.toString();
  }

  return params;
};

const getSmallestSerialNo = (drops: readonly ApiDropId[]): number =>
  drops.reduce(
    (smallest, drop) => Math.min(smallest, drop.serial_no),
    Infinity
  );

const shouldStopDropIdsPagination = ({
  currentBatchLength,
  currentMaxSerialForNextCall,
  itemsPerRequest,
  smallestSerialInCurrentBatch,
  targetSerialNo,
}: {
  readonly currentBatchLength: number;
  readonly currentMaxSerialForNextCall: number | null;
  readonly itemsPerRequest: number;
  readonly smallestSerialInCurrentBatch: number;
  readonly targetSerialNo: number;
}): boolean => {
  if (
    currentBatchLength < itemsPerRequest &&
    smallestSerialInCurrentBatch > targetSerialNo
  ) {
    return true;
  }

  if (
    currentMaxSerialForNextCall !== null &&
    smallestSerialInCurrentBatch >= currentMaxSerialForNextCall &&
    currentBatchLength === itemsPerRequest
  ) {
    return true;
  }

  return smallestSerialInCurrentBatch < targetSerialNo;
};

const collectDropIds = (
  drops: readonly ApiDropId[],
  allFetchedDropsMap: Map<number, ApiDropId>,
  targetSerialNo: number
): boolean => {
  let targetFound = false;

  for (const drop of drops) {
    if (!allFetchedDropsMap.has(drop.serial_no)) {
      allFetchedDropsMap.set(drop.serial_no, drop);
    }
    if (drop.serial_no === targetSerialNo) {
      targetFound = true;
    }
  }

  return targetFound;
};

async function findDropIdsBySerialNoWithPagination(
  targetSerialNo: number,
  apiParams: DropIdsApiParams,
  signal?: AbortSignal
): Promise<ApiDropId[]> {
  let currentMaxSerialForNextCall: number | null =
    apiParams.max_serial_no ?? null;
  let requestsMade = 0;

  const allFetchedDropsMap = new Map<number, ApiDropId>(); // Used to store unique drops by serial_no
  let targetFound = false;

  if (!Number.isFinite(apiParams.min_serial_no)) {
    throw new TypeError("min_serial_no is required in apiParams");
  }

  const itemsPerRequest = getDropIdsPageLimit(apiParams.limit);

  while (requestsMade < MAX_DROP_IDS_REQUESTS) {
    requestsMade++;

    const currentBatch = await commonApiFetchWithRetry<ApiDropId[]>({
      endpoint: `drop-ids`,
      params: buildDropIdsRequestParams({
        apiParams,
        currentMaxSerialForNextCall,
        itemsPerRequest,
      }),
      signal,
      retryOptions: {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffFactor: 2,
        jitter: 0.1,
      },
    });

    if (signal?.aborted === true) {
      throw new Error("Request aborted by signal.");
    }

    if (currentBatch.length === 0) {
      const maxSerialLabel = currentMaxSerialForNextCall ?? "newest";
      throw new Error(
        `Target serial number ${targetSerialNo} not found. No (more) items match criteria with wave_id=${apiParams.wave_id} and max_serial_no=${maxSerialLabel}.`
      );
    }

    targetFound = collectDropIds(
      currentBatch,
      allFetchedDropsMap,
      targetSerialNo
    );

    const smallestSerialInCurrentBatch = getSmallestSerialNo(currentBatch);

    if (targetFound) {
      // If target is found, we have processed its batch. We can break and return relevant drops.
      break;
    }

    if (
      shouldStopDropIdsPagination({
        currentBatchLength: currentBatch.length,
        currentMaxSerialForNextCall,
        itemsPerRequest,
        smallestSerialInCurrentBatch,
        targetSerialNo,
      })
    ) {
      break;
    }

    currentMaxSerialForNextCall = smallestSerialInCurrentBatch;
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

  return Array.from(allFetchedDropsMap.values()).sort(
    (a, b) => b.serial_no - a.serial_no
  ); // Sort descending by serial_no
}
