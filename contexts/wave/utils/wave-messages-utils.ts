import { WAVE_DROPS_PARAMS } from "../../../components/react-query-wrapper/utils/query-utils";
import { commonApiFetch } from "../../../services/api/common-api";
import { ApiWaveDropsFeed } from "../../../generated/models/ApiWaveDropsFeed";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

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
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error; // Re-throw abort errors to be handled by the caller
    }
    
    // TODO: add some retry logic
    console.error(
      `[WaveDataManager] Failed to fetch messages for ${waveId}:`,
      error
    );
    return null;
  }
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
  const dropsMap = new Map<string, ExtendedDrop>();

  // First, add all current drops to the map
  currentDrops.forEach((drop) => {
    dropsMap.set(drop.id, drop);
  });

  // Then add all new drops, overwriting any duplicates
  // This ensures we keep the newest version of each drop
  newDrops.forEach((drop) => {
    dropsMap.set(drop.id, drop);
  });

  // Convert the map back to an array
  const mergedDrops = Array.from(dropsMap.values());

  // Sort by serial_no in descending order (older first)
  return mergedDrops.sort((a, b) => a.serial_no - b.serial_no);
}
