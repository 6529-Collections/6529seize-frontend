import { renderHook, act } from '@testing-library/react';
import { useWaveDataFetching } from '@/contexts/wave/hooks/useWaveDataFetching';

const getLoadingState = jest.fn(() => ({ state: { isLoading: false, promise: null }, shouldContinue: true }));
const setLoadingState = jest.fn();
const setPromise = jest.fn();
const clearLoadingState = jest.fn();

jest.mock('@/contexts/wave/hooks/useWaveLoadingState', () => ({
  useWaveLoadingState: () => ({ getLoadingState, setLoadingState, setPromise, clearLoadingState }),
}));

const cancelFetch = jest.fn();
const createController = jest.fn(() => ({ signal: {} } as AbortController));
const cleanupController = jest.fn();

jest.mock('@/contexts/wave/hooks/useWaveAbortController', () => ({
  useWaveAbortController: () => ({ cancelFetch, createController, cleanupController }),
}));

export const fetchWaveMessages = jest.fn();
export const formatWaveMessages = jest.fn();
export const createEmptyWaveMessages = jest.fn();
export const fetchNewestWaveMessages = jest.fn();

jest.mock('@/contexts/wave/utils/wave-messages-utils', () => ({
  fetchWaveMessages: (...args: any[]) => fetchWaveMessages(...args),
  formatWaveMessages: (...args: any[]) => formatWaveMessages(...args),
  createEmptyWaveMessages: (...args: any[]) => createEmptyWaveMessages(...args),
  fetchNewestWaveMessages: (...args: any[]) => fetchNewestWaveMessages(...args),
}));

describe('useWaveDataFetching', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function setup(initial: Record<string, any>) {
    const store = { ...initial };
    const updateData = jest.fn((u: any) => { store[u.key] = { ...store[u.key], ...u }; });
    const getData = jest.fn((key: string) => store[key]);
    const { result } = renderHook(() => useWaveDataFetching({ updateData, getData }));
    return { result, updateData, getData, store };
  }

  it('fetches wave data and updates store', async () => {
    fetchWaveMessages.mockResolvedValue([{ id: 'd1', serial_no: 1 }]);
    formatWaveMessages.mockReturnValue({ key: 'wave1', drops: [{ id: 'd1' }] });
    createEmptyWaveMessages.mockReturnValue({ key: 'wave1', drops: [] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave('wave1');
      await Promise.resolve();
    });

    expect(setLoadingState).toHaveBeenCalledWith('wave1', true);
    expect(createController).toHaveBeenCalledWith('wave1');
    expect(fetchWaveMessages).toHaveBeenCalledWith('wave1', null, expect.any(Object), expect.any(Function));
    expect(updateData).toHaveBeenNthCalledWith(1, { key: 'wave1', drops: [] });
    expect(updateData).toHaveBeenLastCalledWith({ key: 'wave1', drops: [{ id: 'd1' }] });
  });

  it('ignores abort errors', async () => {
    const abortError = new DOMException('aborted', 'AbortError');
    fetchWaveMessages.mockRejectedValue(abortError);
    createEmptyWaveMessages.mockReturnValue({ key: 'wave1', drops: [] });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave('wave1');
      await Promise.resolve();
    });

    expect(updateData).toHaveBeenCalledTimes(1); // only initial empty state
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('syncNewestMessages updates data and returns result', async () => {
    fetchNewestWaveMessages.mockResolvedValue({ drops: [{ id: 'd', serial_no: 11 }], highestSerialNo: 11 });
    formatWaveMessages.mockReturnValue({ key: 'wave1', drops: [{ id: 'd' }] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    const res = await result.current.syncNewestMessages('wave1', 10, new AbortController().signal);
    expect(fetchNewestWaveMessages).toHaveBeenCalledWith('wave1', 10, 50, expect.any(Object), expect.any(Function));
    expect(updateData).toHaveBeenCalledWith({ key: 'wave1', drops: [{ id: 'd' }] });
    expect(res).toEqual({ drops: [{ id: 'd', serial_no: 11 }], highestSerialNo: 11 });
  });

  it('syncNewestMessages handles error', async () => {
    fetchNewestWaveMessages.mockResolvedValue({ drops: null, highestSerialNo: null });
    const { result, updateData } = setup({ wave1: { drops: [] } });
    const res = await result.current.syncNewestMessages('wave1', 10, new AbortController().signal);
    expect(updateData).not.toHaveBeenCalled();
    expect(res).toEqual({ drops: null, highestSerialNo: null });
  });
});
