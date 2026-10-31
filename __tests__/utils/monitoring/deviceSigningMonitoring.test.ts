import {
  recordDeviceSigningEvent,
  reportSignedWriteFallback,
} from "@/utils/monitoring/deviceSigningMonitoring";
import * as Sentry from "@sentry/nextjs";

jest.mock("@sentry/nextjs", () => {
  const scope = {
    setLevel: jest.fn(),
    setFingerprint: jest.fn(),
    addEventProcessor: jest.fn(),
  };
  return {
    addBreadcrumb: jest.fn(),
    captureMessage: jest.fn(),
    withScope: jest.fn((callback: (value: typeof scope) => void) =>
      callback(scope)
    ),
    __scope: scope,
  };
});

const scope = (Sentry as unknown as { __scope: Record<string, jest.Mock> })
  .__scope;

describe("device signing monitoring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reports a fallback reason with codes and timings only", () => {
    reportSignedWriteFallback({
      action: "post",
      reason: "timeout",
      phase: "lock",
      elapsedMs: 10_012.4,
      lockWaitMs: undefined,
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Signed write fallback (timeout)"
    );
    expect(scope["setLevel"]).toHaveBeenCalledWith("warning");
    expect(scope["setFingerprint"]).toHaveBeenCalledWith([
      "device-signing",
      "timeout",
      "lock",
    ]);
    const processor = scope["addEventProcessor"]!.mock.calls[0]![0] as (
      event: Record<string, unknown>
    ) => Record<string, unknown>;
    const event = processor({
      message: "Signed write fallback (timeout)",
      user: { id: "someone" },
      request: { url: "https://6529.io/waves/x" },
      breadcrumbs: [{ message: "content" }],
      contexts: { app: {} },
      tags: { other: "x" },
    });
    expect(event).toEqual({
      message: "Signed write fallback (timeout)",
      tags: {
        feature: "device-signing",
        signing_action: "post",
        signing_fallback_reason: "timeout",
        signing_phase: "lock",
      },
      extra: { elapsed_ms: 10_012, lock_wait_ms: undefined },
    });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: "device-signing", level: "warning" })
    );
  });

  it("never lets monitoring failures escape", () => {
    (Sentry.addBreadcrumb as jest.Mock).mockImplementation(() => {
      throw new Error("Sentry down");
    });
    expect(() =>
      reportSignedWriteFallback({
        action: "react",
        reason: "rejected",
        phase: "send",
      })
    ).not.toThrow();
    expect(() =>
      recordDeviceSigningEvent("Signing prompt answered", { decision: "retry" })
    ).not.toThrow();
  });
});
