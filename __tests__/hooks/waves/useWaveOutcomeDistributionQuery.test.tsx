import { renderHook } from '@testing-library/react';
import { useWaveOutcomeDistributionQuery } from '@/hooks/waves/useWaveOutcomeDistributionQuery';
import { useInfiniteQuery } from '@tanstack/react-query';
import { commonApiFetch } from '@/services/api/common-api';
import { QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query');
jest.mock('@/services/api/common-api');

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const fetchMock = commonApiFetch as jest.Mock;

describe('useWaveOutcomeDistributionQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [], pageParams: [] },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });
  });

  it('should be disabled when outcomeIndex is null', () => {
    renderHook(() =>
      useWaveOutcomeDistributionQuery({
        waveId: 'wave1',
        outcomeIndex: null,
      })
    );

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.WAVE_OUTCOME_DISTRIBUTION,
          'wave1',
          '',
          100,
          'ASC',
        ],
        enabled: false,
      })
    );
  });

  it('should be enabled when outcomeIndex is 0', () => {
    renderHook(() =>
      useWaveOutcomeDistributionQuery({
        waveId: 'wave1',
        outcomeIndex: 0,
      })
    );

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.WAVE_OUTCOME_DISTRIBUTION,
          'wave1',
          '0',
          100,
          'ASC',
        ],
        enabled: true,
      })
    );
  });

  it('should be enabled when outcomeIndex is "1"', () => {
    renderHook(() =>
      useWaveOutcomeDistributionQuery({
        waveId: 'wave1',
        outcomeIndex: '1',
      })
    );

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.WAVE_OUTCOME_DISTRIBUTION,
          'wave1',
          '1',
          100,
          'ASC',
        ],
        enabled: true,
      })
    );
  });
});
