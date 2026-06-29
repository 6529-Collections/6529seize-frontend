import { getReactionErrorMessage } from "@/components/waves/drops/reaction-utils";

const createStructuredReactionError = ({
  body,
  headers,
  message = "technical error",
  status,
  statusText,
}: {
  body?: unknown;
  headers?: unknown;
  message?: string;
  status?: number;
  statusText?: string;
}): Error & {
  headers?: unknown;
  status?: number;
  response: {
    body?: unknown;
    headers?: unknown;
    status?: number;
    statusText?: string;
  };
} =>
  Object.assign(new Error(message), {
    ...(headers !== undefined ? { headers } : {}),
    ...(status !== undefined ? { status } : {}),
    response: {
      ...(body !== undefined ? { body } : {}),
      ...(headers !== undefined ? { headers } : {}),
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
          status: 400,
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

  it("skips blank details messages and uses the first later valid one", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({
            details: [
              { message: "   " },
              { message: "  Reaction not allowed  " },
            ],
          }),
          message: "unexpected raw error",
        }),
        "Error adding reaction"
      )
    ).toBe("Reaction not allowed");
  });

  it("skips malformed detail entries before finding a valid message", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({
            details: [null, "bad", {}, { message: "Retry later" }],
          }),
          message: "unexpected raw error",
        }),
        "Error adding reaction"
      )
    ).toBe("Retry later");
  });

  it("falls back when no detail entry contains a usable message", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({
            details: [null, { message: "   " }, { message: 123 }],
          }),
          message: "Bad Request",
          status: 400,
          statusText: "Bad Request",
        }),
        "Error adding reaction"
      )
    ).toBe("Bad Request");
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

  it("maps unauthorized status when response is null", () => {
    expect(
      getReactionErrorMessage(
        Object.assign(new Error("Something went wrong"), {
          status: 401,
          response: null,
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
    ).toBe("You are reacting too quickly. Try again in a moment.");
  });

  it("honors retry-after metadata for rate-limit messages", () => {
    const headers = new Headers({ "Retry-After": "2" });

    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({ error: "Rate limit exceeded" }),
          headers,
          message: "Rate limit exceeded",
          status: 429,
          statusText: "Too Many Requests",
        }),
        "Error adding reaction"
      )
    ).toBe("You are reacting too quickly. Try again in 2 seconds.");
  });

  it("localizes rate-limit retry-after messages", () => {
    const headers = new Headers({ "Retry-After": "3600000" });

    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          headers,
          message: "Rate limit exceeded",
          status: 429,
          statusText: "Too Many Requests",
        }),
        "Error adding reaction",
        "de-DE"
      )
    ).toBe("Du reagierst zu schnell. Versuche es in 60.000 Minuten erneut.");
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

  it("surfaces the structured status text when the parsed json body has no known fields", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({ foo: "bar" }),
          message: "Bad Request",
          status: 400,
          statusText: "Bad Request",
        }),
        "Error adding reaction"
      )
    ).toBe("Bad Request");
  });

  it("surfaces the structured status text when parsed json known fields are blank", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: JSON.stringify({ error: "   " }),
          message: "Bad Request",
          status: 400,
          statusText: "Bad Request",
        }),
        "Error adding reaction"
      )
    ).toBe("Bad Request");
  });

  it("surfaces the structured status text when an object body has no known fields", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError({
          body: { foo: "bar" },
          message: "Bad Request",
          status: 400,
          statusText: "Bad Request",
        }),
        "Error adding reaction"
      )
    ).toBe("Bad Request");
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

  it("falls back to the structured error message when response is missing", () => {
    expect(
      getReactionErrorMessage(
        Object.assign(new Error("Service Unavailable"), {
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
    ).toBe(
      "Network request failed. Please check your connection and try again. (https://api.test.6529.io/api/drops/drop-1/reaction)"
    );
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
