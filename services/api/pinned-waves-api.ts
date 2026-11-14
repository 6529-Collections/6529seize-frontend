import {
  commonApiDelete,
  commonApiFetch,
  commonApiPut,
  commonApiPostWithoutBodyAndResponse,
} from "./common-api";

import type { ApiPinnedWaveOrder } from "@/generated/models/ApiPinnedWaveOrder";
import type { ApiUpdatePinnedWaveOrder } from "@/generated/models/ApiUpdatePinnedWaveOrder";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";

const PINNED_WAVES_ENDPOINT = "v2/waves/pinned";

interface PinnedWavesService {
  getPinnedWaves: (signal: AbortSignal) => Promise<ApiWaveOverview[]>;
  updateOrder: (order: ApiUpdatePinnedWaveOrder) => Promise<ApiPinnedWaveOrder>;
  pinWave: (waveId: string) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
}

export const pinnedWavesApi: PinnedWavesService = {
  getPinnedWaves: (signal) =>
    commonApiFetch({ endpoint: PINNED_WAVES_ENDPOINT, signal }),
  updateOrder: (body) =>
    commonApiPut({ endpoint: PINNED_WAVES_ENDPOINT, body }),
  pinWave: async (waveId: string): Promise<void> => {
    await commonApiPostWithoutBodyAndResponse({
      endpoint: `waves/${waveId}/pins`,
    });
  },

  unpinWave: async (waveId: string): Promise<void> => {
    await commonApiDelete({
      endpoint: `waves/${waveId}/pins`,
    });
  },
};
