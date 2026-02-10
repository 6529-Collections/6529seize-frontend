import { renderHook, act } from '@testing-library/react';
import { useWaveIsTyping } from '@/hooks/useWaveIsTyping';
import { WsMessageType } from '@/helpers/Types';

const listeners: any[] = [];

jest.mock('@/hooks/useWaveWebSocket', () => ({
  useWaveWebSocket: () => ({
    socket: {
      addEventListener: (_: string, cb: any) => listeners.push(cb),
      removeEventListener: jest.fn(),
    },
  }),
}));

test('reports typing status and clears after timeout', () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useWaveIsTyping('wave', null));

  act(() => {
    listeners[0]({ data: JSON.stringify({ type: WsMessageType.USER_IS_TYPING, data: { wave_id: 'wave', profile: { handle: 'A', level: 1 } } }) });
  });
  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toContain('A is typing');

  act(() => jest.advanceTimersByTime(6000));
  expect(result.current).toBe('');
});
