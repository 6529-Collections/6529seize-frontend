import { DropReactionRequestTimeoutError } from "@/helpers/reactions/dropReactionRequestQueue";
import {
  classifyReactionError,
  isReactionRequestOutcomeUncertain,
} from "@/utils/monitoring/dropReactionErrorClassification";

describe("reaction timeout classification", () => {
  it.each([
    new DropReactionRequestTimeoutError(),
    new DOMException("Timed out", "TimeoutError"),
  ])("does not treat DOM timeout code 23 as an HTTP status", (error) => {
    expect(error.code).toBe(23);
    expect(classifyReactionError(error)).toEqual({
      statusCode: null,
      errorKind: "timeout",
    });
  });

  it.each([
    [401, "auth"],
    [403, "auth"],
    [404, "endpoint-contract"],
    [405, "endpoint-contract"],
    [429, "rate-limit"],
    [500, "server"],
    [503, "server"],
    [504, "server"],
  ])("preserves actual HTTP %s", (status, errorKind) => {
    expect(classifyReactionError({ status, name: "TimeoutError" })).toEqual({
      statusCode: status,
      errorKind,
    });
  });

  it("preserves structured response/code statuses and network errors", () => {
    expect(classifyReactionError({ response: { status: 503 } })).toEqual({
      statusCode: 503,
      errorKind: "server",
    });
    expect(classifyReactionError({ code: 401 })).toEqual({
      statusCode: 401,
      errorKind: "auth",
    });
    expect(classifyReactionError(new TypeError("Failed to fetch"))).toEqual({
      statusCode: null,
      errorKind: "network",
    });
  });
});

describe("uncertain reaction outcome", () => {
  it.each([
    new DropReactionRequestTimeoutError(),
    new TypeError("Failed to fetch"),
    new Error(
      "Network request failed. Please check your connection and try again."
    ),
    new Error("Failed to parse response as JSON: Network error"),
  ])("requires confirmation for %s", (error) => {
    expect(isReactionRequestOutcomeUncertain(error)).toBe(true);
  });

  it.each([400, 401, 403, 404, 405, 429, 500, 503, 504])(
    "preserves explicit HTTP %s rejection handling even with a network message",
    (status) => {
      expect(
        isReactionRequestOutcomeUncertain({ status, message: "Network error" })
      ).toBe(false);
    }
  );

  it.each([
    new DOMException("Aborted", "AbortError"),
    new Error("Unexpected token in JSON"),
    new Error("Something went wrong"),
  ])("does not turn unrelated errors into uncertain outcomes: %s", (error) => {
    expect(isReactionRequestOutcomeUncertain(error)).toBe(false);
  });
});
