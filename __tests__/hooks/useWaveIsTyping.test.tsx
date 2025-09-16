import { act, renderHook } from '@testing-library/react';
import { useWaveIsTyping } from '../../hooks/useWaveIsTyping';
import { WsMessageType } from '../../helpers/Types';
import { useWebSocket } from '../../services/websocket/useWebSocket';
import { useWebSocketMessage } from '../../services/websocket/useWebSocketMessage';

jest.mock('../../services/websocket/useWebSocketMessage', () => ({
  useWebSocketMessage: jest.fn(),
}));

jest.mock('../../services/websocket/useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));

const sendMock = jest.fn();
const messageHandlers: Partial<
  Record<WsMessageType, Array<(payload: any) => void>>
> = {};

const mockedUseWebSocketMessage =
  useWebSocketMessage as jest.MockedFunction<typeof useWebSocketMessage>;
const mockedUseWebSocket = useWebSocket as jest.MockedFunction<
  typeof useWebSocket
>;

const emitMessage = (type: WsMessageType, payload: any) => {
  messageHandlers[type]?.forEach((handler) => handler(payload));
};

beforeEach(() => {
  jest.useFakeTimers();
  sendMock.mockClear();
  Object.keys(messageHandlers).forEach((key) => {
    delete messageHandlers[key as WsMessageType];
  });

  mockedUseWebSocketMessage.mockImplementation((type, callback) => {
    if (!messageHandlers[type]) {
      messageHandlers[type] = [];
    }
    messageHandlers[type]!.push(callback);
    return { isConnected: true };
  });

  mockedUseWebSocket.mockReturnValue({
    send: sendMock,
  } as any);
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test('reports typing status and clears after timeout', () => {
  const { result, unmount } = renderHook(() => useWaveIsTyping('wave', null));

  expect(sendMock).toHaveBeenCalledWith(WsMessageType.SUBSCRIBE_TO_WAVE, {
    subscribe: true,
    wave_id: 'wave',
  });

  act(() => {
    emitMessage(WsMessageType.USER_IS_TYPING, {
      wave_id: 'wave',
      profile: { handle: 'A', level: 1 },
      timestamp: Date.now(),
    });
  });

  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(result.current).toContain('A is typing');

  act(() => {
    jest.advanceTimersByTime(6000);
  });
  expect(result.current).toBe('');

  unmount();
  expect(sendMock).toHaveBeenLastCalledWith(WsMessageType.SUBSCRIBE_TO_WAVE, {
    subscribe: false,
    wave_id: 'wave',
  });
});
