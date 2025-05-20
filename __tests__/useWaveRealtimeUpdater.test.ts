import { renderHook, act } from '@testing-library/react';
import { useWaveRealtimeUpdater, ProcessIncomingDropType } from '../contexts/wave/hooks/useWaveRealtimeUpdater';

jest.mock('../services/websocket/useWebSocketMessage', () => ({
  useWebSocketMessage: () => ({ isConnected: true }),
}));

jest.mock('../services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

const { commonApiFetch } = require('../services/api/common-api');

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('useWaveRealtimeUpdater', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('optimistically adds drop and syncs newest messages', async () => {
    const store: any = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const updateData = jest.fn((update: any) => {
      store[update.key] = { ...store[update.key], ...update };
    });
    const props = {
      getData: (key: string) => store[key],
      updateData,
      registerWave: jest.fn(),
      syncNewestMessages: jest.fn().mockResolvedValue({ drops: null, highestSerialNo: null }),
      removeDrop: jest.fn(),
    };

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: 'd1', wave: { id: 'wave1' }, author: {} };
    await act(async () => {
      await result.current.processIncomingDrop(drop, ProcessIncomingDropType.DROP_INSERT);
      await flushPromises();
    });

    expect(updateData).toHaveBeenCalledWith({
      key: 'wave1',
      drops: [expect.objectContaining({ id: 'd1', stableKey: 'd1', stableHash: 'd1' })],
    });
    expect(props.syncNewestMessages).toHaveBeenCalledWith('wave1', 10, expect.any(AbortSignal));
  });

  it('logs on aborted fetch without updating state', async () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const store: any = { wave1: { drops: [], latestFetchedSerialNo: 1 } };
    const updateData = jest.fn();
    const props = {
      getData: (key: string) => store[key],
      updateData,
      registerWave: jest.fn(),
      syncNewestMessages: jest.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')),
      removeDrop: jest.fn(),
    };

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: 'd2', wave: { id: 'wave1' }, author: {} };
    await act(async () => {
      await result.current.processIncomingDrop(drop, ProcessIncomingDropType.DROP_INSERT);
      await flushPromises();
    });

    expect(consoleLog).toHaveBeenCalled();
    expect(updateData).toHaveBeenCalledTimes(1);
    consoleLog.mockRestore();
  });

  it('logs error when fetch fails', async () => {
    const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const store: any = { wave1: { drops: [], latestFetchedSerialNo: 1 } };
    const updateData = jest.fn();
    const props = {
      getData: (key: string) => store[key],
      updateData,
      registerWave: jest.fn(),
      syncNewestMessages: jest.fn().mockRejectedValue(new Error('fail')),
      removeDrop: jest.fn(),
    };

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: 'd3', wave: { id: 'wave1' }, author: {} };
    await act(async () => {
      await result.current.processIncomingDrop(drop, ProcessIncomingDropType.DROP_INSERT);
      await flushPromises();
    });

    expect(consoleErr).toHaveBeenCalled();
    expect(updateData).toHaveBeenCalledTimes(1);
    consoleErr.mockRestore();
  });
});
