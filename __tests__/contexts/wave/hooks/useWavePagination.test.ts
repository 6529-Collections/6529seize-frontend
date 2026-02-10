import { renderHook, act } from '@testing-library/react';
import { useWavePagination } from '@/contexts/wave/hooks/useWavePagination';
import { DropSize } from '@/helpers/waves/drop.helpers';
import { WAVE_DROPS_PARAMS } from '@/components/react-query-wrapper/utils/query-utils';

// Mock abort controller utilities
const cancelFetch = jest.fn();
const createController = jest.fn(() => ({ signal: {} } as AbortController));
const cleanupController = jest.fn();

jest.mock('@/contexts/wave/hooks/useWaveAbortController', () => ({
  useWaveAbortController: () => ({
    cancelFetch,
    createController,
    cleanupController,
  }),
}));

// Mock network utilities
export const fetchWaveMessages = jest.fn();
export const fetchLightWaveMessages = jest.fn();
export const fetchAroundSerialNoWaveMessages = jest.fn();

jest.mock('@/contexts/wave/utils/wave-messages-utils', () => ({
  fetchWaveMessages: (...args: unknown[]) => fetchWaveMessages(...args),
  fetchLightWaveMessages: (...args: unknown[]) => fetchLightWaveMessages(...args),
  fetchAroundSerialNoWaveMessages: (...args: unknown[]) =>
    fetchAroundSerialNoWaveMessages(...args),
}));

interface WaveState {
  id: string;
  isLoading: boolean;
  isLoadingNextPage: boolean;
  hasNextPage: boolean;
  drops: Array<{ id: string; serial_no: number; type: DropSize }>;
  latestFetchedSerialNo: number | null;
}

describe('useWavePagination', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function setup(initial: Record<string, WaveState>) {
    const store = { ...initial };
    const updateData = jest.fn(({ key, ...rest }) => {
      store[key] = { ...store[key], ...(rest as Partial<WaveState>) };
    });
    const getData = jest.fn((key: string) => store[key]);

    const { result } = renderHook(() =>
      useWavePagination({
        // cast to any to satisfy WaveDataStoreUpdater
        updateData: updateData as any,
        getData: getData as any,
        removeDrop: jest.fn(),
      })
    );

    return { result, updateData, getData, store };
  }

  it('fetchNextPage appends drops and updates loading flags', async () => {
    const initial: Record<string, WaveState> = {
      wave1: {
        id: 'wave1',
        isLoading: false,
        isLoadingNextPage: false,
        hasNextPage: true,
        drops: [
          { id: 'a', serial_no: 3, type: DropSize.FULL },
        ],
        latestFetchedSerialNo: null,
      },
    };

    fetchWaveMessages.mockResolvedValue([
      { id: 'b', serial_no: 2 },
      { id: 'c', serial_no: 1 },
    ]);

    const { result, updateData } = setup(initial);

    await act(async () => {
      await result.current.fetchNextPage({ waveId: 'wave1', type: DropSize.FULL });
    });

    expect(fetchWaveMessages).toHaveBeenCalledWith('wave1', 3, expect.any(Object));

    // First call sets loading state
    expect(updateData).toHaveBeenCalledWith({
      key: 'wave1',
      isLoadingNextPage: true,
    });
    // Last call appends new drops and clears loading
    const lastCall = updateData.mock.calls.at(-1)![0];
    expect(lastCall.isLoadingNextPage).toBe(false);
    expect(lastCall.hasNextPage).toBe(true);
    expect(lastCall.drops).toHaveLength(2);
  });

  it('handles abort errors when fetching next page', async () => {
    const initial: Record<string, WaveState> = {
      wave1: {
        id: 'wave1',
        isLoading: false,
        isLoadingNextPage: false,
        hasNextPage: true,
        drops: [
          { id: 'a', serial_no: 3, type: DropSize.FULL },
        ],
        latestFetchedSerialNo: null,
      },
    };

    const abortError = new DOMException('aborted', 'AbortError');
    fetchWaveMessages.mockRejectedValue(abortError);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result, updateData } = setup(initial);
    await act(async () => {
      await result.current.fetchNextPage({ waveId: 'wave1', type: DropSize.FULL });
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(updateData).toHaveBeenLastCalledWith({
      key: 'wave1',
      isLoadingNextPage: false,
    });
    consoleSpy.mockRestore();
  });

  it('processes only the latest around-serial request', async () => {
    const initial: Record<string, WaveState> = {
      wave1: {
        id: 'wave1',
        isLoading: false,
        isLoadingNextPage: false,
        hasNextPage: true,
        drops: [],
        latestFetchedSerialNo: null,
      },
    };

    fetchAroundSerialNoWaveMessages.mockResolvedValue([
      { id: 'd', serial_no: 110 },
    ]);

    const { result } = setup(initial);

    act(() => {
      result.current.fetchAroundSerialNo('wave1', 100);
      result.current.fetchAroundSerialNo('wave1', 110);
    });

    // allow queue to resolve
    await act(async () => {
      // microtask queue flush
    });

    expect(fetchAroundSerialNoWaveMessages).toHaveBeenCalledTimes(2);
    expect(fetchAroundSerialNoWaveMessages).toHaveBeenNthCalledWith(
      1,
      'wave1',
      100,
      expect.any(Object)
    );
    expect(fetchAroundSerialNoWaveMessages).toHaveBeenNthCalledWith(
      2,
      'wave1',
      110 + (WAVE_DROPS_PARAMS.limit - 1),
      expect.any(Object)
    );
  });
});
