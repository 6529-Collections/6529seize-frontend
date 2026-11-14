import {
  recordDeviceSigningEvent,
  reportDeviceKeyStoreLoss,
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

  it("reports a dropped key store with coarse codes only", () => {
    reportDeviceKeyStoreLoss({
      browser: "Brave on Windows",
      persisted: "denied",
      persistedBefore: "unknown",
      usage: "1-10MB",
      quota: ">=10GB",
      encryptedStore: "empty",
      hintAge: "1-24h",
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Device key store lost"
    );
    expect(scope["setFingerprint"]).toHaveBeenCalledWith([
      "device-signing",
      "key-store-lost",
      "Brave on Windows",
    ]);
    const processor = scope["addEventProcessor"]!.mock.calls[0]![0] as (
      event: Record<string, unknown>
    ) => Record<string, unknown>;
    expect(
      processor({
        message: "Device key store lost",
        user: { id: "someone" },
        request: { url: "https://6529.io/waves/x" },
        breadcrumbs: [{ message: "content" }],
        contexts: { app: {} },
        transaction: "/waves/[wave]",
      })
    ).toEqual({
      message: "Device key store lost",
      tags: {
        feature: "device-signing",
        key_store_browser: "Brave on Windows",
        key_store_persisted: "denied",
        key_store_persisted_before: "unknown",
        key_store_encrypted_store: "empty",
      },
      extra: {
        storage_usage: "1-10MB",
        storage_quota: ">=10GB",
        grant_note_age: "1-24h",
      },
    });
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
