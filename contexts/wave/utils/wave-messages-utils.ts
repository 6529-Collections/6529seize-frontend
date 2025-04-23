import { WAVE_DROPS_PARAMS } from "../../../components/react-query-wrapper/utils/query-utils";
import { commonApiFetch } from "../../../services/api/common-api";
import { ApiWaveDropsFeed } from "../../../generated/models/ApiWaveDropsFeed";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import {
  ExtendedDrop,
  getStableDropKey,
} from "../../../helpers/waves/drop.helpers";
import { WaveMessagesUpdate } from "../hooks/types";

/**
 * Fetches wave messages (drops) for a specific wave
 * @param waveId The ID of the wave to fetch messages for
 * @param serialNo Optional serial number to fetch messages before (for pagination)
 * @param signal Optional AbortSignal for cancellation
 * @returns Array of ApiDrop with wave data attached, or null if the request fails
 */
export async function fetchWaveMessages(
  waveId: string,
  serialNo: number | null,
  signal?: AbortSignal
): Promise<ApiDrop[] | null> {
  const params: Record<string, string> = {
    limit: WAVE_DROPS_PARAMS.limit.toString(),
  };
  if (serialNo) {
    params.serial_no_less_than = `${serialNo}`;
  }

  try {
    const data = await commonApiFetch<ApiWaveDropsFeed>({
      endpoint: `waves/${waveId}/drops`,
      params,
      signal,
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
    isLoading?: boolean;
    isLoadingNextPage?: boolean;
    hasNextPage?: boolean;
  } = {}
): WaveMessagesUpdate {
  const {
    isLoading = false,
    isLoadingNextPage = false,
    hasNextPage = true,
  } = options;

  // Calculate the highest serial number from the fetched drops
  const latestFetchedSerialNo =
    drops.length > 0
      ? Math.max(...drops.map((drop) => drop.serial_no))
      : undefined;

  const update: WaveMessagesUpdate = {
    key: waveId,
    id: waveId,
    isLoading,
    isLoadingNextPage,
    hasNextPage: hasNextPage,
    drops: drops.map((drop) => ({
      ...drop,
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
    isLoading?: boolean;
    isLoadingNextPage?: boolean;
    hasNextPage?: boolean;
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
 * Handles an error when fetching wave messages
 * @param error The error that occurred
 * @param waveId ID of the wave that failed
 * @throws Re-throws abort errors
 * @returns null
 */
function handleWaveMessagesError(error: unknown, waveId: string): null {
  // Check if this is an abort error
  if (error instanceof DOMException && error.name === "AbortError") {
    throw error; // Re-throw abort errors to be handled by the caller
  }

  console.error(
    `[WaveDataManager] Error fetching messages for ${waveId}:`,
    error
  );
  return null;
}

/**
 * Merges two arrays of drops, removing duplicates based on id,
 * preferring newer versions of duplicates, and sorting by serial_no
 *
 * @param currentDrops Current array of drops
 * @param newDrops New array of drops to merge in
 * @returns A new merged array with no duplicates, sorted by serial_no
 */
export function mergeDrops(
  currentDrops: ExtendedDrop[],
  newDrops: ExtendedDrop[]
): ExtendedDrop[] {
  // Create a map for fast lookup by id
  const dropsMapStableKey = new Map<string, ExtendedDrop>();

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

  const dropsMapSerialNo = new Map<number, ExtendedDrop>();

  for (const drop of mergedDrops) {
    dropsMapSerialNo.set(drop.serial_no, drop);
  }

  const finalDrops = Array.from(dropsMapSerialNo.values());

  finalDrops.sort((a, b) => {
    const aIsTemp = a.id?.startsWith("temp-") ?? false;
    const bIsTemp = b.id?.startsWith("temp-") ?? false;

    if (aIsTemp || !bIsTemp)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    return b.serial_no - a.serial_no;
  });
  return finalDrops;
}

// Helper function to get the highest serial number from an array of drops
function getHighestSerialNo(
  drops: ApiDrop[] | ExtendedDrop[]
): number | null {
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
  signal?: AbortSignal
): Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }> {
  const params: Record<string, string> = {
    limit: limit.toString(),
  };
  if (sinceSerialNo !== null) {
    // Assuming API uses these parameters for fetching newer messages
    params.serial_no_limit = `${sinceSerialNo}`;
    params.search_strategy = "FIND_NEWER";
  }

  try {
    const data = await commonApiFetch<ApiWaveDropsFeed>({
      endpoint: `waves/${waveId}/drops`,
      params,
      signal,
    });

    const fetchedDrops = data.drops.map((drop) => ({
      ...drop,
      wave: data.wave,
    }));

    const highestSerialNo = getHighestSerialNo(fetchedDrops);

    return { drops: fetchedDrops, highestSerialNo };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log(`[Utils] Fetch newest for ${waveId} aborted.`);
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
  // this signature “x is number” tells TS that inside `filter` we only keep numbers
  const nums = [a, b].filter(
    (x): x is number => typeof x === "number" && Number.isFinite(x)
  );

  return nums.length > 0 ? Math.max(...nums) : null;
};
