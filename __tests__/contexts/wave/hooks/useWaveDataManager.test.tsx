import { renderHook } from '@testing-library/react';
import { useWaveDataManager } from '@/contexts/wave/hooks/useWaveDataManager';

const fetchFns = {
  registerWave: jest.fn(),
  cancelWaveDataFetch: jest.fn(),
  syncNewestMessages: jest.fn(),
};
const paginationFns = {
  fetchNextPage: jest.fn(),
  cancelPaginationFetch: jest.fn(),
  fetchAroundSerialNo: jest.fn(),
};

jest.mock('@/contexts/wave/hooks/useWaveDataFetching', () => ({
  useWaveDataFetching: jest.fn(() => fetchFns),
}));

jest.mock('@/contexts/wave/hooks/useWavePagination', () => ({
  useWavePagination: jest.fn(() => paginationFns),
}));

describe('useWaveDataManager', () => {
  it('returns composed functions', () => {
    const updateData = jest.fn();
    const getData = jest.fn();
    const removeDrop = jest.fn();
    const { result } = renderHook(() =>
      useWaveDataManager({ updateData, getData, removeDrop })
    );
    expect(result.current.registerWave).toBe(fetchFns.registerWave);
    expect(result.current.fetchNextPage).toBe(paginationFns.fetchNextPage);
  });
});
