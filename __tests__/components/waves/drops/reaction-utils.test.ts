import { getReactionErrorMessage } from "@/components/waves/drops/reaction-utils";

const createStructuredReactionError = ({
  body,
  message = "technical error",
  status,
  statusText,
}: {
  body?: unknown;
  message?: string;
  status?: number;
  statusText?: string;
}): Error & {
  status?: number;
  response: { body?: unknown; status?: number; statusText?: string };
} =>
  Object.assign(new Error(message), {
    ...(status !== undefined ? { status } : {}),
    response: {
      ...(body !== undefined ? { body } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(statusText !== undefined ? { statusText } : {}),
    },
  });

describe("getReactionErrorMessage", () => {
  it("surfaces the error field from structured API errors", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({ error: "Rate limited" }),
          message: "unexpected raw error",
          status: 429,
        }),
        "Error adding reaction"
      )
    ).toBe("Rate limited");
  });

  it("surfaces the message field from structured API errors", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({ message: "Unauthorized" }),
          message: "unexpected raw error",
          status: 401,
        }),
        "Error adding reaction"
      )
    ).toBe("Unauthorized");
  });

  it("surfaces the first details message from structured API errors", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({
            details: [{ message: "Reaction not allowed" }],
          }),
          message: "unexpected raw error",
        }),
        "Error adding reaction"
      )
    ).toBe("Reaction not allowed");
  });

  it("falls back for non-JSON structured error bodies", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: "<html><body>Bad Gateway</body></html>",
          message: "<html><body>Bad Gateway</body></html>",
          status: 502,
        }),
        "Error adding reaction"
      )
    ).toBe("Error adding reaction");
  });

  it("maps unauthorized status when the structured body is missing", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          message: "Something went wrong",
          status: 401,
        }),
        "Error adding reaction"
      )
    ).toBe("Unauthorized");
  });

  it("maps rate-limit status when the structured body is blank", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: "   ",
          message: "   ",
          status: 429,
          statusText: "Too Many Requests",
        }),
        "Error adding reaction"
      )
    ).toBe("Too Many Requests");
  });

  it("surfaces the structured status text when the structured body is missing", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          message: "Service Unavailable",
          status: 503,
          statusText: "Service Unavailable",
        }),
        "Error adding reaction"
      )
    ).toBe("Service Unavailable");
  });

  it("surfaces the structured status text when the structured body is blank", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: "   ",
          message: "   ",
          status: 404,
          statusText: "Not Found",
        }),
        "Error adding reaction"
      )
    ).toBe("Not Found");
  });

  it("falls back to the structured error message when status text is unavailable", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: "   ",
          message: "Service Unavailable",
          status: 503,
        }),
        "Error adding reaction"
      )
    ).toBe("Service Unavailable");
  });

  it("falls back for generic network errors", () => {
    expect(
      getReactionErrorMessage(
        new Error(
          "Network request failed. Please check your connection and try again. (https://api.test.6529.io/api/drops/drop-1/reaction)"
        ),
        "Error adding reaction"
      )
    ).toBe("Error adding reaction");
  });

  it("does not use the raw error message when an unsafe body is present", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: "<html><body>Bad Gateway</body></html>",
          message: "Unauthorized",
          status: 401,
        }),
        "Error adding reaction"
      )
    ).toBe("Error adding reaction");
  });
});
