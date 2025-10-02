import { renderHook, act } from '@testing-library/react';
import React from 'react';
import useNewDropCounter from '@/contexts/wave/hooks/useNewDropCounter';
import { AuthContext } from '@/components/auth/Auth';

jest.mock('@/services/websocket/useWebSocketMessage', () => ({
  useWebSocketMessage: jest.fn(),
}));

const { useWebSocketMessage } = require('@/services/websocket/useWebSocketMessage');

const waves = [
  { id: 'wave1', metrics: { latest_drop_timestamp: 10 } },
  { id: 'wave2', metrics: { latest_drop_timestamp: 20 } },
] as any;

let wsCallback: any;
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={{ connectedProfile: { handle: 'me' } } as any}>
    {children}
  </AuthContext.Provider>
);

describe('useNewDropCounter', () => {
  beforeEach(() => {
    (useWebSocketMessage as jest.Mock).mockImplementation((_t: any, cb: any) => {
      wsCallback = cb;
      return { isConnected: true };
    });
  });

  it('increments counts and resets all', () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useNewDropCounter(null, waves, refetch), { wrapper });
    act(() => {
      wsCallback({ wave: { id: 'wave2' }, author: { handle: 'other' }, created_at: 30 });
    });
    expect(result.current.newDropsCounts.wave2.count).toBe(1);
    expect(result.current.newDropsCounts.wave2.latestDropTimestamp).toBe(30);
    act(() => {
      result.current.resetAllWavesNewDropsCount();
    });
    expect(result.current.newDropsCounts.wave1.count).toBe(0);
    expect(result.current.newDropsCounts.wave2.count).toBe(0);
  });

  it('ignores messages from connected profile and resets on active change', () => {
    const { result, rerender } = renderHook(
      ({ activeId }) => useNewDropCounter(activeId, waves, jest.fn()),
      { wrapper, initialProps: { activeId: 'wave1' } }
    );
    expect(result.current.newDropsCounts.wave1.count).toBe(0);
    act(() => {
      wsCallback({ wave: { id: 'wave1' }, author: { handle: 'me' }, created_at: 50 });
    });
    expect(result.current.newDropsCounts.wave1.count).toBe(0);
    rerender({ activeId: 'wave2' });
    expect(result.current.newDropsCounts.wave2.count).toBe(0);
  });
});
