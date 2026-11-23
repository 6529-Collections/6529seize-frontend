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
  pinChanges,
  pinItem,
  type SavedPin,
} from "@/lib/personal-records/personal-record-changes";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";

const PINNED_WAVES_ENDPOINT = "v2/waves/pinned";

interface PinnedWavesService {
  getPinnedWaves: (signal: AbortSignal) => Promise<ApiWaveOverview[]>;
  updateOrder: (order: ApiUpdatePinnedWaveOrder) => Promise<ApiPinnedWaveOrder>;
  pinWave: (waveId: string) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
}

/**
 * The pins as the API saved them, in order, with their positions. Read
 * fresh before records are written, so a pin or reorder changes only the
 * pins whose position moves.
 */
const savedPins = async (): Promise<SavedPin[]> =>
  (
    await commonApiFetch<ApiWaveOverview[]>({
      endpoint: PINNED_WAVES_ENDPOINT,
    })
  ).map((wave) => ({
    id: wave.id,
    position: wave.context_profile_context?.pinned_position ?? null,
  }));

export const pinnedWavesApi: PinnedWavesService = {
  getPinnedWaves: (signal) =>
    commonApiFetch({ endpoint: PINNED_WAVES_ENDPOINT, signal }),
  updateOrder: (body) =>
    savePersonalSetting<ApiPinnedWaveOrder, SavedPin[]>({
      legacy: () => commonApiPut({ endpoint: PINNED_WAVES_ENDPOINT, body }),
      snapshot: savedPins,
      // Only waves still pinned: one another tab unpinned stays unpinned.
      change: (saved) => {
        const pinned = new Set(saved.map((pin) => pin.id));
        return personalChange({
          items: pinChanges(
            body.wave_ids.filter((id) => pinned.has(id)),
            saved
          ),
        });
      },
      recordsResult: () => ({ wave_ids: [...body.wave_ids] }),
    }),
  pinWave: (waveId) =>
    savePersonalSetting<void, SavedPin[]>({
      legacy: async () => {
        await commonApiPostWithoutBodyAndResponse({
          endpoint: `waves/${waveId}/pins`,
        });
      },
      snapshot: savedPins,
      // A new pin goes last, after every saved pin.
      change: (saved) =>
        personalChange({
          items: pinChanges(
            [
              ...saved.map((pin) => pin.id).filter((id) => id !== waveId),
              waveId,
            ],
            saved
          ),
        }),
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
