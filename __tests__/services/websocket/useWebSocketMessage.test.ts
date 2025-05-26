import { renderHook } from '@testing-library/react';
import { useWebSocketMessage } from '../../../services/websocket/useWebSocketMessage';
import { WebSocketStatus } from '../../../services/websocket/WebSocketTypes';

jest.mock('../../../services/websocket/useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));

const { useWebSocket } = require('../../../services/websocket/useWebSocket');

describe('useWebSocketMessage', () => {
  it('subscribes when connected and cleans up on unmount', () => {
    const unsubscribe = jest.fn();
    const subscribe = jest.fn().mockReturnValue(unsubscribe);
    useWebSocket.mockReturnValue({ subscribe, status: WebSocketStatus.CONNECTED });
    const callback = jest.fn();
    const { unmount, result } = renderHook(() => useWebSocketMessage('TYPE' as any, callback));
    expect(result.current.isConnected).toBe(true);
    expect(subscribe).toHaveBeenCalledWith('TYPE', callback);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('does nothing when disconnected', () => {
    const subscribe = jest.fn();
    useWebSocket.mockReturnValue({ subscribe, status: WebSocketStatus.DISCONNECTED });
    const { result } = renderHook(() => useWebSocketMessage('T' as any, jest.fn()));
    expect(result.current.isConnected).toBe(false);
    expect(subscribe).not.toHaveBeenCalled();
  });
});
