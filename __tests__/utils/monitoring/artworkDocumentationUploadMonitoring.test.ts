import * as Sentry from "@sentry/nextjs";
import { createRequire } from "node:module";
import { reportArtworkDocumentationUploadFailure } from "@/utils/monitoring/artworkDocumentationUploadMonitoring";

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
const context = () => ({
  stage: "transfer" as const,
  profileVersion: 3,
  assetState: "uploading",
  attempt: {},
});
beforeEach(() => jest.clearAllMocks());

describe("privacy-safe artwork upload diagnostics", () => {
  it.each([
    [
      new TypeError("Failed to fetch private-filename.png?token=secret"),
      "transport",
    ],
    [
      Object.assign(new Error("private artist note"), { status: 503 }),
      "server",
    ],
    [
      Object.assign(new Error("private rights answer"), { status: 422 }),
      "client",
    ],
    [{ private: "artist writing", token: "secret" }, "unexpected"],
  ])(
    "classifies failures without reporting the thrown input: %s",
    (error, kind) => {
      reportArtworkDocumentationUploadFailure(error, context());
      const captured = jest.mocked(Sentry.captureException).mock.calls[0]![0];
      expect(captured).toMatchObject({
        name: "ArtworkDocumentationUploadError",
        message: `Artwork documentation upload failed (transfer, ${kind})`,
      });
      expect(captured).not.toBe(error);
      expect(captured).not.toHaveProperty("cause");
      expect(mockScope.setFingerprint).toHaveBeenCalledWith([
        "artwork-documentation-upload",
        "transfer",
        kind,
      ]);
      expect(JSON.stringify(captured)).not.toMatch(
        /private|secret|artist writing/
      );
    }
  );

  it("ignores cancellation and deduplicates each phase within one attempt", () => {
    const attempt = context();
    reportArtworkDocumentationUploadFailure(
      new DOMException("private", "AbortError"),
      attempt
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
    reportArtworkDocumentationUploadFailure(
      new Error("PART_UPLOAD_FAILED"),
      attempt
    );
    reportArtworkDocumentationUploadFailure(
      new Error("private retry details"),
      attempt
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    reportArtworkDocumentationUploadFailure(
      new Error("UPLOAD_STATUS_CHECK_FAILED"),
      { ...attempt, stage: "check" }
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
    reportArtworkDocumentationUploadFailure(
      new Error("PART_UPLOAD_FAILED"),
      context()
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(3);
  });

  it("retains only allowlisted codes and bounded context values", () => {
    reportArtworkDocumentationUploadFailure(
      Object.assign(new Error("private.png"), {
        status: Infinity,
        response: { body: { code: "secret artist answer" } },
      }),
      {
        ...context(),
        stage: "private-url" as never,
        assetState: "private.png",
        profileVersion: Infinity,
      }
    );
    const processor = mockScope.addEventProcessor.mock.calls[0]![0];
    expect(processor({ tags: { private: "secret" } }).tags).toEqual({
      feature: "artwork-documentation-upload",
      upload_stage: "unknown",
      failure_kind: "unexpected",
      error_code: "unknown",
      http_status: "unknown",
      profile_version: "unknown",
      asset_state: "unknown",
    });
    reportArtworkDocumentationUploadFailure(
      new Error("PART_UPLOAD_FAILED"),
      context()
    );
    expect(
      mockScope.addEventProcessor.mock.calls[1]![0]({}).tags.error_code
    ).toBe("PART_UPLOAD_FAILED");
  });

  it("preserves recovery if the monitoring SDK fails", () => {
    jest.mocked(Sentry.withScope).mockImplementationOnce(() => {
      throw new Error("unavailable");
    });
    expect(() =>
      reportArtworkDocumentationUploadFailure(
        new TypeError("Failed to fetch"),
        context()
      )
    ).not.toThrow();
  });

  it("removes inherited private data after real SDK scope merging", async () => {
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
    const isolation = new Scope();
    isolation.addBreadcrumb({ message: "private filename and signed URL" });
    isolation.setExtra("secret", "private artwork answer");
    isolation.setUser({ id: "private artist" });
    isolation.setContext("draft", { text: "private" });
    isolation.setTag("private_tag", "secret");
    const current = new Scope();
    const event: Sentry.Event = {
      release: "reviewed-release",
      event_id: "upload-diagnostic",
      timestamp: 1,
      request: { url: "https://private.invalid/file?token=secret" },
      transaction: "/private/context",
      exception: {
        values: [
          {
            type: "ArtworkDocumentationUploadError",
            value: "Artwork documentation upload failed (transfer, transport)",
          },
        ],
      },
    };
    const prepare = (scope: Sentry.Scope) =>
      prepareEvent(
        { integrations: [], stackParser: () => [] },
        event,
        {},
        scope,
        undefined,
        isolation
      );
    const original = await prepare(current);
    expect(original?.breadcrumbs).toHaveLength(1);
    reportArtworkDocumentationUploadFailure(
      new TypeError("Failed to fetch private.png"),
      context()
    );
    current.addEventProcessor(mockScope.addEventProcessor.mock.calls[0]![0]);
    const result = await prepare(current);
    for (const field of [
      "breadcrumbs",
      "extra",
      "request",
      "user",
      "contexts",
      "transaction",
    ])
      expect(result).not.toHaveProperty(field);
    expect(result?.release).toBe("reviewed-release");
    expect(result?.tags?.["feature"]).toBe("artwork-documentation-upload");
    expect(JSON.stringify(result)).not.toMatch(/private|secret/);
    expect(await prepare(new Scope())).toEqual(original);
  });
});
