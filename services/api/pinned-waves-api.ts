import { commonApiFetch, commonApiPostWithoutBodyAndResponse, commonApiDelete } from './common-api';
import { ApiWave } from '../../generated/models/ApiWave';
import { ApiWavesPinFilter } from '../../generated/models/ApiWavesPinFilter';
import { ApiWavesOverviewType } from '../../generated/models/ApiWavesOverviewType';

export interface PinnedWavesService {
  fetchPinnedWaves: () => Promise<ApiWave[]>;
  pinWave: (waveId: string) => Promise<void>;
  unpinWave: (waveId: string) => Promise<void>;
}

export const pinnedWavesApi: PinnedWavesService = {
  fetchPinnedWaves: async (): Promise<ApiWave[]> => {
    return await commonApiFetch<ApiWave[]>({
      endpoint: 'waves-overview',
      params: {
        pinned: ApiWavesPinFilter.Pinned,
        type: ApiWavesOverviewType.MostSubscribed,
        limit: '20',
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