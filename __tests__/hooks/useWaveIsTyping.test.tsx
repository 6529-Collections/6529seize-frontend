import { act, renderHook, waitFor } from '@testing-library/react';
import { useWaveIsTyping } from '@/hooks/useWaveIsTyping';
import { WsMessageType } from '@/helpers/Types';
import { useWebSocket } from '@/services/websocket/useWebSocket';
import { useWebSocketMessage } from '@/services/websocket/useWebSocketMessage';
import { WebSocketStatus } from '@/services/websocket/WebSocketTypes';

jest.mock('@/services/websocket/useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));

jest.mock('@/services/websocket/useWebSocketMessage', () => ({
  useWebSocketMessage: jest.fn(),
}));

const sendMock = jest.fn();

const mockedUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;
const mockedUseWebSocketMessage = useWebSocketMessage as jest.MockedFunction<typeof useWebSocketMessage>;

type MessageHandlers = Partial<Record<WsMessageType, Array<(payload: any) => void>>>;

let messageHandlers: MessageHandlers;

const emitMessage = (type: WsMessageType, payload: any) => {
  messageHandlers[type]?.forEach((handler) => handler(payload));
};

beforeEach(() => {
  jest.useFakeTimers();
  sendMock.mockReset();
  mockedUseWebSocket.mockReset();
  mockedUseWebSocketMessage.mockReset();

  messageHandlers = {};

  mockedUseWebSocket.mockReturnValue({
    send: sendMock,
    status: WebSocketStatus.CONNECTED,
  } as any);

  mockedUseWebSocketMessage.mockImplementation((type, callback) => {
    if (!messageHandlers[type]) {
      messageHandlers[type] = [];
    }
    messageHandlers[type]!.push(callback);
    return { isConnected: true };
  });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

test('reports typing status, handles drop updates, and clears after timeout', async () => {
  const { result, unmount } = renderHook(() => useWaveIsTyping('wave', null));

  await waitFor(() =>
    expect(sendMock).toHaveBeenCalledWith(WsMessageType.SUBSCRIBE_TO_WAVE, {
      subscribe: true,
      wave_id: 'wave',
    }),
  );

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
    emitMessage(WsMessageType.DROP_UPDATE, {
      wave: { id: 'wave' },
      author: { handle: 'A', level: 1 },
    });
  });
  expect(result.current).toBe('');

  act(() => {
    emitMessage(WsMessageType.USER_IS_TYPING, {
      wave_id: 'wave',
      profile: { handle: 'A', level: 1 },
      timestamp: Date.now(),
    });
  });

  act(() => {
    jest.advanceTimersByTime(6000);
  });
  expect(result.current).toBe('');

  act(() => {
    unmount();
  });

  expect(sendMock).toHaveBeenLastCalledWith(WsMessageType.SUBSCRIBE_TO_WAVE, {
    subscribe: false,
    wave_id: 'wave',
  });
});
