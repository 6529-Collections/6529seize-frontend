import {
  commonApiDelete,
  commonApiPostWithoutBodyAndResponse,
} from "./common-api";

interface PinnedWavesService {
  pinWave: (waveId: string) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
}

export const pinnedWavesApi: PinnedWavesService = {
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
