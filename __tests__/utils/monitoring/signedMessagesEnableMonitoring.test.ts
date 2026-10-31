import * as Sentry from "@sentry/nextjs";
import { reportSignedMessagesEnable } from "@/utils/monitoring/signedMessagesEnableMonitoring";

const mockScope = {
  setLevel: jest.fn(),
  setFingerprint: jest.fn(),
  addEventProcessor: jest.fn(),
};
jest.mock("@sentry/nextjs", () => ({
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: typeof mockScope) => void) =>
    callback(mockScope)
  ),
  captureMessage: jest.fn(),
}));

describe("turn on signed messages monitoring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("records flow steps and the user's own choices as breadcrumbs only", () => {
    reportSignedMessagesEnable("notice", "signature-requested", "remote");
    reportSignedMessagesEnable("notice", "rejected", "browser");

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "device-signing",
      level: "info",
      message: "Turn on signed messages: signature-requested",
      data: {
        feature: "device-signing",
        signed_messages_enable_source: "notice",
        signed_messages_enable_event: "signature-requested",
        signed_messages_enable_wallet: "remote",
      },
    });
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("sends failures as warnings that carry only reason codes", () => {
    reportSignedMessagesEnable("renew", "walletconnect-session", "remote");

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Turn on signed messages failed (walletconnect-session)"
    );
    expect(mockScope.setLevel).toHaveBeenCalledWith("warning");
    expect(mockScope.setFingerprint).toHaveBeenCalledWith([
      "device-signing",
      "enable",
      "walletconnect-session",
    ]);
    const processor = mockScope.addEventProcessor.mock.calls[0]?.[0] as (
      event: Record<string, unknown>
    ) => Record<string, unknown>;
    const bounded = processor({
      message: "Turn on signed messages failed (walletconnect-session)",
      user: { id: "0x1111111111111111111111111111111111111111" },
      request: { url: "https://6529.io/waves/1" },
      breadcrumbs: [{ message: "private" }],
      contexts: { wallet: {} },
      transaction: "/waves/[wave]",
    });
    expect(bounded).toEqual({
      message: "Turn on signed messages failed (walletconnect-session)",
      tags: {
        feature: "device-signing",
        signed_messages_enable_source: "renew",
        signed_messages_enable_event: "walletconnect-session",
        signed_messages_enable_wallet: "remote",
      },
      extra: {},
    });
  });

  it("never lets monitoring break the flow", () => {
    jest.mocked(Sentry.addBreadcrumb).mockImplementationOnce(() => {
      throw new Error("sentry down");
    });
    expect(() =>
      reportSignedMessagesEnable("devices", "connect-failed")
    ).not.toThrow();
  });
});
