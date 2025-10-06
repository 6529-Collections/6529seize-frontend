import { renderHook, act } from '@testing-library/react';
import { useVirtualizedWaveMessages } from '@/hooks/useVirtualizedWaveMessages';
import { Drop } from '@/helpers/waves/drop.helpers';

jest.useFakeTimers();

jest.mock('@/contexts/wave/MyStreamContext', () => ({
  useMyStreamWaveMessages: jest.fn(),
}));

jest.mock('@/hooks/useDropMessages', () => ({
  useDropMessages: jest.fn(),
}));

const { useMyStreamWaveMessages } = require('@/contexts/wave/MyStreamContext');
const { useDropMessages } = require('@/hooks/useDropMessages');

describe('useVirtualizedWaveMessages', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns undefined when no data available', () => {
    useMyStreamWaveMessages.mockReturnValue(undefined);
    useDropMessages.mockReturnValue(undefined);

    const { result } = renderHook(() => useVirtualizedWaveMessages('wave1', null, 5));
    expect(result.current).toBeUndefined();
  });

  it('paginates locally and reveals drops', async () => {
    const drops: Drop[] = [
      { serial_no: 1 } as any,
      { serial_no: 2 } as any,
      { serial_no: 3 } as any,
      { serial_no: 4 } as any,
      { serial_no: 5 } as any,
    ];
    const waveData = {
      id: 'wave1',
      isLoading: false,
      isLoadingNextPage: false,
      hasNextPage: false,
      drops,
      latestFetchedSerialNo: 5,
      fetchNextPage: jest.fn(),
    };

    useMyStreamWaveMessages.mockReturnValue(waveData);
    useDropMessages.mockReturnValue(waveData);

    const { result } = renderHook(() => useVirtualizedWaveMessages('wave1', null, 2));

    expect(result.current?.drops.length).toBe(2);
    expect(result.current?.hasMoreLocal).toBe(true);

    act(() => {
      result.current?.loadMoreLocally();
    });

    expect(result.current?.drops.length).toBe(4);

    await act(async () => {
      const p = result.current!.waitAndRevealDrop(5, 100, 10);
      jest.runAllTimers();
      const success = await p;
      expect(success).toBe(true);
    });

    expect(result.current?.drops.length).toBe(5);
  });
});
