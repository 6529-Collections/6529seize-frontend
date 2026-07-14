const mockSpan = {
  end: jest.fn(),
  setAttribute: jest.fn(),
};
const mockStartSpanManual = jest.fn(
  (_options: unknown, callback: (span: typeof mockSpan) => void): void =>
    callback(mockSpan)
);

jest.mock("@sentry/nextjs", () => ({
  startSpanManual: mockStartSpanManual,
}));

import {
  DROP_OPEN_SIGNAL_NAMES,
  markDropOpenReady,
  startDropOpen,
} from "@/utils/monitoring/dropOpenTiming";

describe("dropOpenTiming", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.history.pushState(
      {},
      "",
      "/waves/private-wave-id?drop=private-drop-id"
    );
    Object.defineProperty(globalThis.window, "awsRum", {
      configurable: true,
      value: { recordEvent: jest.fn() },
      writable: true,
    });
    jest
      .spyOn(globalThis.performance, "now")
      .mockReturnValueOnce(100)
      .mockReturnValue(350);
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback): number => {
        callback(0);
        return 1;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete globalThis.window.awsRum;
  });

  it("keeps identifiers out of the Sentry span and AWS compatibility event", () => {
    startDropOpen({
      dropId: "private-drop-id",
      waveId: "private-wave-id",
      source: "leaderboard_list",
      isMobile: false,
    });
    markDropOpenReady({
      dropId: "private-drop-id",
      waveId: "private-wave-id",
    });

    expect(mockStartSpanManual).toHaveBeenCalledWith(
      {
        name: DROP_OPEN_SIGNAL_NAMES.span,
        op: "ui.action",
        attributes: {
          source: "leaderboard_list",
          is_mobile: false,
          "route.family": "/waves/[wave]",
        },
      },
      expect.any(Function)
    );
    expect(globalThis.window.awsRum?.recordEvent).toHaveBeenCalledWith(
      DROP_OPEN_SIGNAL_NAMES.readyEvent,
      {
        duration_ms: 250,
        source: "leaderboard_list",
        is_mobile: false,
        route_family: "/waves/[wave]",
      }
    );

    const telemetryPayload = JSON.stringify({
      rum: globalThis.window.awsRum?.recordEvent,
      sentry: mockStartSpanManual.mock.calls,
    });
    expect(telemetryPayload).not.toContain("private-drop-id");
    expect(telemetryPayload).not.toContain("private-wave-id");
  });
});
