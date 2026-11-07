import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WsMessageType } from "@/helpers/Types";
import { WebSocketContext } from "@/services/websocket/WebSocketContext";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { useOpenWaveSocketSync } from "@/services/websocket/useOpenWaveSocketSync";

let visibility: DocumentVisibilityState = "visible";

const setVisibility = (next: DocumentVisibilityState) => {
  visibility = next;
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

function setup(initial: {
  readonly status: WebSocketStatus;
  readonly waveId: string | null;
}) {
  const send = jest.fn();
  let status = initial.status;
  let lastWaveId = initial.waveId;
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <WebSocketContext.Provider value={{ status, send } as never}>
      {children}
    </WebSocketContext.Provider>
  );
  const view = renderHook(
    ({ waveId }: { readonly waveId: string | null }) =>
      useOpenWaveSocketSync(waveId),
    { initialProps: { waveId: initial.waveId }, wrapper }
  );
  const update = (next: {
    readonly status?: WebSocketStatus;
    readonly waveId?: string | null;
  }) => {
    if (next.status !== undefined) status = next.status;
    view.rerender({
      waveId: next.waveId === undefined ? lastWaveId : next.waveId,
    });
    if (next.waveId !== undefined) lastWaveId = next.waveId;
  };
  const sentWaveIds = () =>
    send.mock.calls.map(([type, data]) => {
      expect(type).toBe(WsMessageType.SET_OPEN_WAVE);
      return (data as { wave_id: string | null }).wave_id;
    });
  return { send, update, sentWaveIds };
}

describe("useOpenWaveSocketSync", () => {
  beforeAll(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(document, "visibilityState");
  });

  beforeEach(() => {
    visibility = "visible";
  });

  it("tells a connected socket the open wave, and not before it connects", () => {
    const { update, sentWaveIds } = setup({
      status: WebSocketStatus.CONNECTING,
      waveId: "wave-1",
    });
    expect(sentWaveIds()).toEqual([]);

    update({ status: WebSocketStatus.CONNECTED });
    expect(sentWaveIds()).toEqual(["wave-1"]);

    // Re-rendering with the same wave sends nothing more.
    update({});
    expect(sentWaveIds()).toEqual(["wave-1"]);
  });

  it("sends the new wave on a switch and null on leaving the wave view", () => {
    const { update, sentWaveIds } = setup({
      status: WebSocketStatus.CONNECTED,
      waveId: "wave-1",
    });
    update({ waveId: "wave-2" });
    update({ waveId: null });

    expect(sentWaveIds()).toEqual(["wave-1", "wave-2", null]);
  });

  it.each([WebSocketStatus.DISCONNECTED, WebSocketStatus.AUTHENTICATING])(
    "sends the open wave again after the socket goes %s and back",
    (between) => {
      const { update, sentWaveIds } = setup({
        status: WebSocketStatus.CONNECTED,
        waveId: "wave-1",
      });
      update({ status: between });
      update({ status: WebSocketStatus.CONNECTED });

      expect(sentWaveIds()).toEqual(["wave-1", "wave-1"]);
    }
  );

  it("sends nothing to a new connection when no wave is open", () => {
    const { update, sentWaveIds } = setup({
      status: WebSocketStatus.CONNECTED,
      waveId: null,
    });
    update({ status: WebSocketStatus.DISCONNECTED });
    update({ status: WebSocketStatus.CONNECTED });

    expect(sentWaveIds()).toEqual([]);
  });

  it("clears the open wave while the tab is hidden", () => {
    const { sentWaveIds } = setup({
      status: WebSocketStatus.CONNECTED,
      waveId: "wave-1",
    });
    setVisibility("hidden");
    setVisibility("visible");

    expect(sentWaveIds()).toEqual(["wave-1", null, "wave-1"]);
  });

  it("does nothing without a socket provider", () => {
    expect(() =>
      renderHook(() => useOpenWaveSocketSync("wave-1"))
    ).not.toThrow();
  });
});
