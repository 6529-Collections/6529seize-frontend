import * as Sentry from "@sentry/nextjs";
import { reportDropSubmissionFailure } from "@/utils/monitoring/dropSubmissionMonitoring";

const mockScope = {
  clearBreadcrumbs: jest.fn(),
  setUser: jest.fn(),
  setLevel: jest.fn(),
  setFingerprint: jest.fn(),
  setTag: jest.fn(),
};
jest.mock("@sentry/nextjs", () => ({
  withScope: jest.fn((callback: (scope: typeof mockScope) => void) =>
    callback(mockScope)
  ),
  captureException: jest.fn(),
}));

describe("drop submission monitoring", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it.each([
    new TypeError("Failed to fetch"),
    new Error(
      "Network request failed. (https://example.test/private-wave?token=private-token)"
    ),
    new Error("Load failed"),
  ])(
    "reports a handled transport failure without its private diagnostic",
    (error) => {
      reportDropSubmissionFailure(error);
      const captured = jest.mocked(Sentry.captureException).mock.calls[0]?.[0];
      expect(captured).toBeInstanceOf(Error);
      expect(captured).toMatchObject({
        name: "DropSubmissionError",
        message: "Drop submission failed (transport)",
      });
      expect(captured).not.toBe(error);
      expect(captured).not.toHaveProperty("cause");
      expect(JSON.stringify(captured)).not.toContain("private");
      expect(mockScope.clearBreadcrumbs).toHaveBeenCalledTimes(1);
      expect(mockScope.setUser).toHaveBeenCalledWith(null);
      expect(mockScope.setFingerprint).toHaveBeenCalledWith([
        "drop-submission",
        "transport",
      ]);
    }
  );

  it.each([400, 401, 403, 404, 409, 422, 429])(
    "does not report an expected HTTP %i rejection",
    (status) => {
      reportDropSubmissionFailure(
        Object.assign(new Error("private moderation explanation"), {
          status,
          response: {
            body: {
              code: "CONTENT_MODERATION_REJECTED",
              content: "private submission",
            },
          },
        })
      );
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.withScope).not.toHaveBeenCalled();
    }
  );

  it("does not report an aborted submission", () => {
    reportDropSubmissionFailure(new DOMException("Aborted", "AbortError"));
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports a server failure without copying response content", () => {
    reportDropSubmissionFailure(
      Object.assign(new Error("private response content"), { status: 503 })
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Drop submission failed (server)" })
    );
  });

  it("reports an unexpected failure without copying an arbitrary thrown value", () => {
    reportDropSubmissionFailure({ content: "private submission" });
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Drop submission failed (unexpected)",
      })
    );
  });

  it("preserves the caller when Sentry fails", () => {
    jest.mocked(Sentry.withScope).mockImplementationOnce(() => {
      throw new Error("reporter unavailable");
    });
    expect(() =>
      reportDropSubmissionFailure(new TypeError("Failed to fetch"))
    ).not.toThrow();
  });
});
