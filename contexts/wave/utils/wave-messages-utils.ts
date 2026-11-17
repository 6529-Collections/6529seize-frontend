import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { Drop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
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
    ...(wave.authenticated_user_eligible_to_reply === undefined
      ? {}
      : {
          authenticated_user_eligible_to_reply:
            wave.authenticated_user_eligible_to_reply,
        }),
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
