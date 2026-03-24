import { extractErrorDetails } from "@/utils/error-extractor";

describe("extractErrorDetails", () => {
  it("returns the stack for Error instances when available", () => {
    const error = new Error("Boom");
    error.stack = "custom stack";

    expect(extractErrorDetails(error)).toBe("custom stack");
  });

  it("falls back to the error message when the Error stack is empty", () => {
    const error = new Error("Boom");
    error.stack = "";

    expect(extractErrorDetails(error)).toBe("Boom");
  });

  it("returns plain string errors unchanged", () => {
    expect(extractErrorDetails("plain error")).toBe("plain error");
  });

  it("returns the stack property from plain objects when present", () => {
    expect(
      extractErrorDetails({
        stack: "object stack",
        message: "object message",
      })
    ).toBe("object stack");
  });

  it("returns the message property from plain objects when no stack exists", () => {
    expect(extractErrorDetails({ message: "object message" })).toBe(
      "object message"
    );
  });

  it("serializes plain objects when they do not expose stack or message", () => {
    expect(extractErrorDetails({ code: 500, reason: "wat" })).toBe(
      JSON.stringify({ code: 500, reason: "wat" })
    );
  });

  it("falls back safely for non-serializable objects", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(extractErrorDetails(circular)).toBe("Complex error object");
  });

  it("handles null and primitive values without throwing", () => {
    expect(extractErrorDetails(null)).toBe("null");
    expect(extractErrorDetails(42)).toBe("42");
  });
});
