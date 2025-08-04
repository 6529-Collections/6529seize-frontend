import { renderHook } from '@testing-library/react';
import React from 'react';
import useWavesList from '../../hooks/useWavesList';
import { AuthContext } from '../../components/auth/Auth';
import { ApiWaveType } from '../../generated/models/ApiWaveType';

jest.mock('../../hooks/useWavesOverview', () => ({
  useWavesOverview: jest.fn(),
}));

jest.mock('../../hooks/usePinnedWavesServer', () => ({
  usePinnedWavesServer: jest.fn(),
}));

jest.mock('../../hooks/useWaveData', () => ({
  useWaveData: jest.fn(),
}));

jest.mock('../../hooks/useShowFollowingWaves', () => ({
  useShowFollowingWaves: jest.fn(() => [false]),
}));

const useWavesOverviewMock = require('../../hooks/useWavesOverview').useWavesOverview as jest.Mock;
const usePinnedWavesServerMock = require('../../hooks/usePinnedWavesServer').usePinnedWavesServer as jest.Mock;
const useWaveDataMock = require('../../hooks/useWaveData').useWaveData as jest.Mock;

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={{ connectedProfile: { handle: 'me' }, activeProfileProxy: null } as any}>
    {children}
  </AuthContext.Provider>
);

const dmWave = {
  id: '1',
  created_at: 0,
  metrics: { latest_drop_timestamp: 50 },
  wave: { type: ApiWaveType.Chat },
  chat: { scope: { group: { is_direct_message: true } } },
} as any;
const mainWave = {
  id: '2',
  created_at: 1,
  metrics: { latest_drop_timestamp: 100 },
  wave: { type: ApiWaveType.Rank },
} as any;
const pinnedExtra = {
  id: '3',
  created_at: 2,
  metrics: { latest_drop_timestamp: 200 },
  wave: { type: ApiWaveType.Rank },
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  useWavesOverviewMock.mockReturnValue({
    waves: [dmWave, mainWave],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    status: 'success',
    refetch: jest.fn(),
  });
  usePinnedWavesServerMock.mockReturnValue({ 
    pinnedIds: ['2', '3'], 
    pinnedWaves: [pinnedExtra],
    pinWave: jest.fn(), 
    unpinWave: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn()
  });
  useWaveDataMock.mockReturnValue({ data: pinnedExtra, isLoading: false, isError: false, refetch: jest.fn() });
});

test('combines main and pinned waves, filtering DMs and flagging pinned', () => {
  const { result } = renderHook(() => useWavesList(), { wrapper });
  const waves = result.current.waves;
  expect(waves.map((w: any) => w.id)).toEqual(['3', '2']);
  expect(waves.every((w: any) => w.isPinned)).toBe(true);
  expect(result.current.pinnedWaves.map((w: any) => w.id)).toEqual(['3']);
});

test('indicates loading when pinned wave is still loading', () => {
  usePinnedWavesServerMock.mockReturnValue({ 
    pinnedIds: ['2', '3'], 
    pinnedWaves: [],
    pinWave: jest.fn(), 
    unpinWave: jest.fn(),
    isLoading: true,
    isError: false,
    refetch: jest.fn()
  });
  const { result } = renderHook(() => useWavesList(), { wrapper });
  expect(result.current.isPinnedWavesLoading).toBe(true);
});
