import { renderHook } from '@testing-library/react';
import { useWaveDecisions } from '@/hooks/waves/useWaveDecisions';
import { useQuery } from '@tanstack/react-query';
import { commonApiFetch } from '@/services/api/common-api';
import { QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query');
jest.mock('@/services/api/common-api');

const useQueryMock = useQuery as jest.Mock;
const fetchMock = commonApiFetch as jest.Mock;

describe('useWaveDecisions', () => {
  const wave = { id: 'w1' } as any;

  it('fetches decisions and sorts winners', async () => {
    const data = {
      data: [
        { decision_time: 2, winners: [{ place: 2 }, { place: 1 }] },
        { decision_time: 1, winners: [{ place: 1 }] }
      ]
    };
    fetchMock.mockResolvedValue(data);
    useQueryMock.mockReturnValue({ data, isError: false, error: null, refetch: jest.fn(), isFetching: false });
    const { result } = renderHook(() => useWaveDecisions({ wave }));
    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: [QueryKey.WAVE_DECISIONS, { waveId: 'w1' }],
      enabled: true,
    }));
    expect(result.current.decisionPoints[0]?.decision_time).toBe(1);
    expect(result.current.decisionPoints[0]?.winners[0].place).toBe(1);
    expect(result.current.decisionPoints[1]?.winners[0].place).toBe(1);
  });
});
