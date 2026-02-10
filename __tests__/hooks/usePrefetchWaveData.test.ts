import { act, renderHook } from '@testing-library/react';
import { usePrefetchWaveData } from '@/hooks/usePrefetchWaveData';
import { useQueryClient } from '@tanstack/react-query';
import { commonApiFetch } from '@/services/api/common-api';
import { QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query');
jest.mock('@/services/api/common-api');

describe('usePrefetchWaveData', () => {
  it('prefetches wave data with correct params', async () => {
    const prefetchQuery = jest.fn();
    (useQueryClient as jest.Mock).mockReturnValue({ prefetchQuery });
    (commonApiFetch as jest.Mock).mockResolvedValue({ id: 'wave' });

    const { result } = renderHook(() => usePrefetchWaveData());
    await act(async () => {
      result.current('wave');
    });

    expect(prefetchQuery).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: 'wave' }],
      queryFn: expect.any(Function),
      staleTime: 60000,
    });

    await prefetchQuery.mock.calls[0][0].queryFn();
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: 'waves/wave' });
  });
});
