import * as Sentry from "@sentry/nextjs";
import { createRequire } from "node:module";
import { reportDropSubmissionFailure } from "@/utils/monitoring/dropSubmissionMonitoring";

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
      expect(mockScope.addEventProcessor).toHaveBeenCalledTimes(1);
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

  it("removes inherited private context after real SDK scope merging without changing other events", async () => {
    // Resolve the SDK's own dependency so this remains valid with pnpm isolation.
    // No client or transport is initialized: only local event preparation runs.
    const { Scope, prepareEvent } = createRequire(
      require.resolve("@sentry/nextjs")
    )("@sentry/core") as {
      Scope: typeof Sentry.Scope;
      prepareEvent: (
        options: { integrations: never[]; stackParser: () => never[] },
        event: Sentry.Event,
        hint: Sentry.EventHint,
        scope: Sentry.Scope,
        client: undefined,
        isolationScope: Sentry.Scope
      ) => PromiseLike<Sentry.Event | null>;
    };
    const isolationScope = new Scope();
    isolationScope.addBreadcrumb({
      category: "console",
      message: "private draft from another operation",
    });
    isolationScope.setExtra("diagnostic", "private moderation evidence");
    isolationScope.setUser({ id: "private-profile" });
    isolationScope.setContext("custom", { note: "private draft" });
    isolationScope.setTag("private_tag", "private-profile");
    const currentScope = new Scope();
    const event: Sentry.Event = {
      release: "reviewed-release",
      event_id: "submission-event",
      timestamp: 1,
      exception: {
        values: [
          {
            type: "DropSubmissionError",
            value: "Drop submission failed (transport)",
          },
        ],
      },
      request: { url: "https://example.test/private-wave" },
      transaction: "/private-wave",
    };
    const options = { integrations: [], stackParser: () => [] };
    const prepare = (scope: Sentry.Scope) =>
      prepareEvent(options, event, {}, scope, undefined, isolationScope);
    const original = await prepare(currentScope);
    expect(original?.breadcrumbs).toHaveLength(1);
    expect(original?.extra).toHaveProperty("diagnostic");

    reportDropSubmissionFailure(new TypeError("Failed to fetch"));
    const processor = mockScope.addEventProcessor.mock.calls[0]?.[0];
    expect(processor).toEqual(expect.any(Function));
    currentScope.addEventProcessor(processor);
    const prepared = await prepare(currentScope);
    expect(prepared).toMatchObject({
      release: "reviewed-release",
      event_id: "submission-event",
      exception: event.exception,
      tags: { feature: "drop-submission", failure_kind: "transport" },
    });
    for (const field of [
      "breadcrumbs",
      "extra",
      "request",
      "user",
      "contexts",
      "transaction",
    ]) {
      expect(prepared).not.toHaveProperty(field);
    }
    expect(JSON.stringify(prepared)).not.toContain("private");
    expect(await prepare(new Scope())).toEqual(original);
  });
});
