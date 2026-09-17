import { EventEmitter } from "node:events";
import type { Page, TestInfo } from "@playwright/test";
import {
  attachPageDiagnostics,
  attachPageDiagnosticsArtifact,
} from "../../tests/support/pageAssertions";
import { assertNoFailedResponses } from "../../tests/support/consoleDiagnostics";

jest.mock("@playwright/test", () => ({ expect: jest.fn() }));

const observedAt = "2026-09-16T14:32:09.000Z";

function request(url: string, errorText = "net::ERR_CONNECTION_RESET") {
  return {
    url: () => url,
    method: () => "GET",
    resourceType: () => "fetch",
    failure: () => ({ errorText }),
  };
}

describe("Playwright network evidence", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(observedAt));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("records UTC time, transport reason and endpoint without URL credentials", async () => {
    const events = new EventEmitter();
    const diagnostics = attachPageDiagnostics(events as unknown as Page);
    events.emit(
      "requestfailed",
      request(
        "https://user:password@api.6529.io/api/settings?token=private#secret"
      )
    );
    expect(diagnostics.networkFailures).toEqual([
      `${observedAt} net::ERR_CONNECTION_RESET GET fetch https://api.6529.io/api/settings`,
    ]);
    expect(diagnostics.failedResponses).toEqual([]);

    const attach = jest.fn();
    await attachPageDiagnosticsArtifact(
      {
        attach,
        config: { failOnFlakyTests: true },
        project: { retries: 2 },
      } as unknown as TestInfo,
      diagnostics
    );
    expect(attach).toHaveBeenCalledWith(
      "playwright-page-diagnostics.txt",
      expect.objectContaining({
        body: expect.stringContaining(diagnostics.networkFailures![0]!),
      })
    );
    expect(attach.mock.calls[0][1].body).not.toMatch(/password|private|secret/);
    expect(attach.mock.calls[0][1].body).toContain(
      "Playwright policy: failOnFlakyTests=true; retries=2"
    );
  });

  it("adds timestamped 5xx evidence while retaining the failing assertion", () => {
    const events = new EventEmitter();
    const diagnostics = attachPageDiagnostics(events as unknown as Page);
    const failedRequest = request("https://6529.io/waves?_rsc=example");
    events.emit("response", {
      status: () => 502,
      request: () => failedRequest,
      url: failedRequest.url,
    });
    expect(diagnostics.networkFailures).toEqual([
      `${observedAt} HTTP 502 GET fetch https://6529.io/waves`,
    ]);
    expect(() => assertNoFailedResponses(diagnostics)).toThrow(
      "502 GET https://6529.io/waves?_rsc=example"
    );
  });

  it("does not mistake HTTP success or a guard abort for an HTTP 5xx", () => {
    const events = new EventEmitter();
    const diagnostics = attachPageDiagnostics(events as unknown as Page);
    events.emit("response", { status: () => 200 });
    events.emit(
      "requestfailed",
      request("https://telemetry.example/", "net::ERR_BLOCKED_BY_CLIENT")
    );
    expect(diagnostics.networkFailures).toEqual([
      `${observedAt} net::ERR_BLOCKED_BY_CLIENT GET fetch https://telemetry.example/`,
    ]);
    expect(() => assertNoFailedResponses(diagnostics)).not.toThrow();
  });

  it("omits malformed URLs and handles unavailable failure details", () => {
    const events = new EventEmitter();
    const diagnostics = attachPageDiagnostics(events as unknown as Page);
    events.emit("requestfailed", {
      ...request("private unparseable value"),
      failure: () => null,
    });
    expect(diagnostics.networkFailures).toEqual([
      `${observedAt} unknown transport failure GET fetch [invalid URL]`,
    ]);
    events.emit("requestfailed", request("data:text/plain,private-content"));
    expect(diagnostics.networkFailures?.[1]).toBe(
      `${observedAt} net::ERR_CONNECTION_RESET GET fetch [non-HTTP URL]`
    );
  });
});
