import * as Sentry from "@sentry/nextjs";
import type { Event } from "@sentry/nextjs";
import { reportUnregisteredMessageKey } from "@/utils/monitoring/i18nMonitoring";

const mockScope = {
  setLevel: jest.fn(),
  setFingerprint: jest.fn(),
  addEventProcessor: jest.fn(),
};
jest.mock("@sentry/nextjs", () => ({
  withScope: jest.fn((callback: (scope: typeof mockScope) => void) =>
    callback(mockScope)
  ),
  captureException: jest.fn(),
}));

describe("i18n monitoring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reports an unregistered key as one grouped error without page context", () => {
    reportUnregisteredMessageKey("museum.network.title");

    const captured = jest.mocked(Sentry.captureException).mock.calls[0]?.[0];
    expect(captured).toMatchObject({
      name: "UnregisteredMessageKeyError",
      message: "Unregistered en-US message key: museum.network.title",
    });
    expect(mockScope.setLevel).toHaveBeenCalledWith("error");
    expect(mockScope.setFingerprint).toHaveBeenCalledWith([
      "i18n-unregistered-message-key",
      "museum.network.title",
    ]);

    const processor = mockScope.addEventProcessor.mock.calls[0]?.[0] as (
      event: Event
    ) => Event;
    const bounded = processor({
      breadcrumbs: [{ message: "private breadcrumb" }],
      extra: { draft: "private draft" },
      request: { url: "https://6529.io/private" },
      user: { id: "user-1" },
      contexts: { app: { app_name: "private" } },
      transaction: "/private",
      tags: { inherited: "private" },
    });
    expect(bounded).toEqual({
      tags: { feature: "i18n", message_key: "museum.network.title" },
    });
  });

  it("never throws when reporting fails", () => {
    jest.mocked(Sentry.withScope).mockImplementationOnce(() => {
      throw new Error("Sentry unavailable");
    });

    expect(() => reportUnregisteredMessageKey("museum.title")).not.toThrow();
  });
});
