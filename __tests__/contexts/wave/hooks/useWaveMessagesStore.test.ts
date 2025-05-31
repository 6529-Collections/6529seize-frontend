import { renderHook, act } from '@testing-library/react';
import useWaveMessagesStore from '../../../../contexts/wave/hooks/useWaveMessagesStore';

describe('useWaveMessagesStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const baseDrop = {
    id: 'd1',
    wave: { id: 'wave1' },
    author: { handle: 'a' },
    parts: [],
    metadata: [],
    created_at: '2020',
    title: '',
    type: 'FULL',
  } as any;

  it('allows subscription and updates data', () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();

    act(() => result.current.subscribe('wave1', listener));
    expect(listener).toHaveBeenCalledWith(undefined);

    act(() => {
      result.current.updateData({ key: 'wave1', drops: [baseDrop] } as any);
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    const data = result.current.getData('wave1');
    expect(data?.drops[0].id).toBe('d1');
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'wave1' }));
  });

  it('removes drops and notifies listeners', () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();

    act(() => result.current.subscribe('wave1', listener));
    act(() => {
      result.current.updateData({ key: 'wave1', drops: [baseDrop] } as any);
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });
    listener.mockClear();

    act(() => result.current.removeDrop('wave1', 'd1'));
    expect(result.current.getData('wave1')?.drops).toHaveLength(0);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ drops: [] }));
  });
});
