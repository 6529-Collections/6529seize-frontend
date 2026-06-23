import { renderHook, act } from '@testing-library/react';
import { useWavePagination } from '@/contexts/wave/hooks/useWavePagination';
import { DropSize } from '@/helpers/waves/drop.helpers';

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

  it('processes the latest uncovered around-serial request after the active fetch', async () => {
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
      result.current.fetchAroundSerialNo('wave1', 200);
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
      200,
      expect.any(Object)
    );
    expect(cancelFetch).not.toHaveBeenCalled();
  });

  it('coalesces duplicate around-serial requests while a fetch is active', async () => {
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

    let resolveFetch:
      | ((drops: Array<{ id: string; serial_no: number }>) => void)
      | null = null;
    fetchAroundSerialNoWaveMessages.mockImplementation(
      () =>
        new Promise<Array<{ id: string; serial_no: number }>>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const { result } = setup(initial);

    act(() => {
      result.current.fetchAroundSerialNo('wave1', 100);
      result.current.fetchAroundSerialNo('wave1', 100);
    });

    expect(fetchAroundSerialNoWaveMessages).toHaveBeenCalledTimes(1);
    expect(cancelFetch).not.toHaveBeenCalled();

    await act(async () => {
      resolveFetch?.([{ id: 'd', serial_no: 100 }]);
    });

    expect(fetchAroundSerialNoWaveMessages).toHaveBeenCalledTimes(1);
  });

  it('skips around-serial requests covered by a currently hydrated drop', async () => {
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
      { id: 'a', serial_no: 90 },
      { id: 'b', serial_no: 100 },
      { id: 'c', serial_no: 110 },
    ]);

    const { result } = setup(initial);

    act(() => {
      result.current.fetchAroundSerialNo('wave1', 100);
    });

    await act(async () => {
      // microtask queue flush
    });

    act(() => {
      result.current.fetchAroundSerialNo('wave1', 100);
    });

    expect(fetchAroundSerialNoWaveMessages).toHaveBeenCalledTimes(1);
  });

  it('refetches a covered serial when the current store only has a light drop', async () => {
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
      { id: 'd', serial_no: 100 },
    ]);

    const { result, store } = setup(initial);

    act(() => {
      result.current.fetchAroundSerialNo('wave1', 100);
    });

    await act(async () => {
      // microtask queue flush
    });

    store.wave1!.drops = [{ id: 'd', serial_no: 100, type: DropSize.LIGHT }];

    act(() => {
      result.current.fetchAroundSerialNo('wave1', 100);
    });

    await act(async () => {
      // microtask queue flush
    });

    expect(fetchAroundSerialNoWaveMessages).toHaveBeenCalledTimes(2);
  });

  it('refetches the same serial after an empty around-serial result', async () => {
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

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fetchAroundSerialNoWaveMessages
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'd', serial_no: 100 }]);

    const { result } = setup(initial);

    act(() => {
      result.current.fetchAroundSerialNo('wave1', 100);
    });

    await act(async () => {
      // microtask queue flush
    });

    act(() => {
      result.current.fetchAroundSerialNo('wave1', 100);
    });

    await act(async () => {
      // microtask queue flush
    });

    expect(fetchAroundSerialNoWaveMessages).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });
});
