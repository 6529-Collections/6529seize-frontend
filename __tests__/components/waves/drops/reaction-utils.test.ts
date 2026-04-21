import { getReactionErrorMessage } from "@/components/waves/drops/reaction-utils";

const createStructuredReactionError = (
  body: unknown,
  message = "technical error"
): Error & { response: { body: unknown } } =>
  Object.assign(new Error(message), {
    response: { body },
  });

describe("getReactionErrorMessage", () => {
  it("surfaces the error field from structured API errors", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError(
          JSON.stringify({ error: "Rate limited" }),
          "unexpected raw error"
        ),
        "Error adding reaction"
      )
    ).toBe("Rate limited");
  });

  it("surfaces the message field from structured API errors", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError(
          JSON.stringify({ message: "Unauthorized" }),
          "unexpected raw error"
        ),
        "Error adding reaction"
      )
    ).toBe("Unauthorized");
  });

  it("surfaces the first details message from structured API errors", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError(
          JSON.stringify({
            details: [{ message: "Reaction not allowed" }],
          }),
          "unexpected raw error"
        ),
        "Error adding reaction"
      )
    ).toBe("Reaction not allowed");
  });

  it("falls back for non-JSON structured error bodies", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError(
          "<html><body>Bad Gateway</body></html>",
          "<html><body>Bad Gateway</body></html>"
        ),
        "Error adding reaction"
      )
    ).toBe("Error adding reaction");
  });

  it("falls back to the structured error message when the body is missing", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError(undefined, "Unauthorized"),
        "Error adding reaction"
      )
    ).toBe("Unauthorized");
  });

  it("falls back to the structured error message when the body is blank", () => {
    expect(
      getReactionErrorMessage(
        createStructuredReactionError("   ", "Too Many Requests"),
        "Error adding reaction"
      )
    ).toBe("Too Many Requests");
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
        createStructuredReactionError(
          "<html><body>Bad Gateway</body></html>",
          "Unauthorized"
        ),
        "Error adding reaction"
      )
    ).toBe("Error adding reaction");
  });
});
