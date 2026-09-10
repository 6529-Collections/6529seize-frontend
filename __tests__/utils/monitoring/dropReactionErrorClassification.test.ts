import { DropReactionRequestTimeoutError } from "@/helpers/reactions/dropReactionRequestQueue";
import { classifyReactionError } from "@/utils/monitoring/dropReactionErrorClassification";

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
