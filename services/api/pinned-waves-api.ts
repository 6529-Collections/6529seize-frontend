import {
  commonApiDelete,
  commonApiFetch,
  commonApiPut,
  commonApiPostWithoutBodyAndResponse,
} from "./common-api";

import type { ApiPinnedWaveOrder } from "@/generated/models/ApiPinnedWaveOrder";
import type { ApiUpdatePinnedWaveOrder } from "@/generated/models/ApiUpdatePinnedWaveOrder";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import {
  personalChange,
  pinItem,
} from "@/lib/personal-records/personal-record-changes";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";

const PINNED_WAVES_ENDPOINT = "v2/waves/pinned";

interface PinnedWavesService {
  getPinnedWaves: (signal: AbortSignal) => Promise<ApiWaveOverview[]>;
  updateOrder: (order: ApiUpdatePinnedWaveOrder) => Promise<ApiPinnedWaveOrder>;
  /**
   * `pinnedIds`: the pinned waves in their order, as this browser shows
   * them. Records carry positions, which only this order gives.
   */
  pinWave: (waveId: string, pinnedIds: readonly string[]) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
}

/**
 * Pins in the order given, each at its index. The API never shows saved
 * positions, so a pin or reorder writes the whole order it read: the
 * order then matches today's, whatever positions were saved before.
 */
const pinsInOrder = (waveIds: readonly string[]) =>
  personalChange({ items: waveIds.map((id, index) => pinItem(id, index)) });

export const pinnedWavesApi: PinnedWavesService = {
  getPinnedWaves: (signal) =>
    commonApiFetch({ endpoint: PINNED_WAVES_ENDPOINT, signal }),
  updateOrder: (body) =>
    savePersonalSetting({
      legacy: () => commonApiPut({ endpoint: PINNED_WAVES_ENDPOINT, body }),
      change: () => pinsInOrder(body.wave_ids),
      recordsResult: () => ({ wave_ids: [...body.wave_ids] }),
    }),
  pinWave: (waveId, pinnedIds) =>
    savePersonalSetting({
      legacy: async () => {
        await commonApiPostWithoutBodyAndResponse({
          endpoint: `waves/${waveId}/pins`,
        });
      },
      // A new pin goes last, after every pin shown.
      change: () =>
        pinsInOrder([...pinnedIds.filter((id) => id !== waveId), waveId]),
      recordsResult: () => undefined,
    }),

  unpinWave: (waveId: string) =>
    savePersonalSetting({
      legacy: async () => {
        await commonApiDelete({
          endpoint: `waves/${waveId}/pins`,
        });
      },
      change: () => personalChange({ items: [pinItem(waveId, null)] }),
      recordsResult: () => undefined,
    }),
};
