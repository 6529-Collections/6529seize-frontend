import { commonApiFetchWithRetry, commonApiPostWithoutBodyAndResponse, commonApiDelete } from './common-api';
import type { ApiWave } from '@/generated/models/ApiWave';
import { ApiWavesPinFilter } from '@/generated/models/ApiWavesPinFilter';
import { ApiWavesOverviewType } from '@/generated/models/ApiWavesOverviewType';

interface PinnedWavesService {
  fetchPinnedWaves: () => Promise<ApiWave[]>;
  pinWave: (waveId: string) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
}

export const pinnedWavesApi: PinnedWavesService = {
  fetchPinnedWaves: async (): Promise<ApiWave[]> => {
    return await commonApiFetchWithRetry<ApiWave[]>({
      endpoint: 'waves-overview',
      params: {
        pinned: ApiWavesPinFilter.Pinned,
        type: ApiWavesOverviewType.MostSubscribed,
        limit: '20',
      },
      retryOptions: {
        maxRetries: 2,
        initialDelayMs: 1000,
        backoffFactor: 2,
        jitter: 0.1,
      },
    });
  },

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
