import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { WebSocketProvider } from '../../../services/websocket/WebSocketProvider';
import { WebSocketContext } from '../../../services/websocket/WebSocketContext';
import { WebSocketStatus } from '../../../services/websocket/WebSocketTypes';
import { WsMessageType } from '../../../helpers/Types';

class MockWebSocket {
  static OPEN = 1;
  readyState = 0; // Start as CONNECTING, then set to OPEN when triggerOpen is called
  onopen: any = null;
  onclose: any = null;
  onmessage: any = null;
  sent: string[] = [];
  close = jest.fn();
  send = jest.fn((msg: string) => { this.sent.push(msg); });
  constructor(public url: string) {}
  triggerOpen() { 
    this.readyState = MockWebSocket.OPEN;
    this.onopen && this.onopen({}); 
  }
  triggerMessage(msg: any) { this.onmessage && this.onmessage({ data: JSON.stringify(msg) }); }
}

describe('WebSocketProvider', () => {
  let originalWs: any;
  beforeEach(() => {
    originalWs = global.WebSocket;
    (global as any).WebSocket = jest.fn((url: string) => new MockWebSocket(url));
    (global as any).WebSocket.OPEN = 1;
  });
  afterEach(() => {
    (global as any).WebSocket = originalWs;
  });

  it('connects and handles messaging', () => {
    const wrapper = ({ children }: any) => (
      <WebSocketProvider config={{ url: 'ws://test' }}>{children}</WebSocketProvider>
    );
    const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
    act(() => { result.current.connect('t'); });
    const ws = (global.WebSocket as unknown as jest.Mock).mock.results[0].value as MockWebSocket;
    act(() => { ws.triggerOpen(); });
    expect(result.current.status).toBe(WebSocketStatus.CONNECTED);

    const cb = jest.fn();
    const unsubscribe = result.current.subscribe(WsMessageType.DROP_UPDATE, cb);
    act(() => { ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 1 } }); });
    expect(cb).toHaveBeenCalledWith({ id: 1 });
    unsubscribe();
    act(() => { ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 2 } }); });
    expect(cb).toHaveBeenCalledTimes(1);

    act(() => { result.current.send(WsMessageType.DROP_UPDATE, { id: 3 }); });
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: WsMessageType.DROP_UPDATE, id: 3 }));

    act(() => { result.current.disconnect(); });
    expect(ws.close).toHaveBeenCalled();
    expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
  });
  it('reconnects on unexpected close', () => {
    jest.useFakeTimers();
    const wrapper = ({ children }: any) => (
      <WebSocketProvider config={{ url: 'ws://test' }}>{children}</WebSocketProvider>
    );
    const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
    act(() => { result.current.connect('abc'); });
    const ws = (global.WebSocket as unknown as jest.Mock).mock.results[0].value as any;
    act(() => { ws.triggerOpen(); });
    act(() => { ws.onclose({ code: 1006 }); });
    act(() => { jest.advanceTimersByTime(2000); });
    expect((global.WebSocket as unknown as jest.Mock).mock.calls[1][0]).toBe('ws://test?token=abc');
    jest.useRealTimers();
  });
});
