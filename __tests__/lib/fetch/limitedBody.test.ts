import {
  BodyTooLargeError,
  UnsupportedContentTypeError,
  assertContentType,
  isHtmlContentType,
  isJsonContentType,
  isTolerantJsonContentType,
  readLimitedJson,
  readLimitedText,
} from "@/lib/fetch/limitedBody";

/**
 * Creates a single-read stream for exercising bounded reader behavior.
 */
function createBody(body: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(body);
  let consumed = false;

  return {
    getReader: () => ({
      read: async () => {
        if (consumed) {
          return { done: true, value: undefined };
        }
        consumed = true;
        return { done: false, value: bytes };
      },
      cancel: async () => {
        consumed = true;
      },
      releaseLock: () => undefined,
    }),
  } as unknown as ReadableStream<Uint8Array>;
}

/**
 * Creates a body source compatible with the limited body reader helpers.
 */
function createBodySource(body: string, headers: Record<string, string> = {}) {
  return {
    body: createBody(body),
    headers: new Headers(headers),
  };
}

describe("limitedBody", () => {
  it("reads text within the byte limit", async () => {
    const response = createBodySource("hello", {
      "content-type": "text/plain",
    });

    await expect(readLimitedText(response, 5)).resolves.toBe("hello");
  });

  it("rejects content-length values above the limit before reading", async () => {
    const response = createBodySource("ok", {
      "content-length": "6",
    });

    await expect(readLimitedText(response, 5)).rejects.toBeInstanceOf(
      BodyTooLargeError
    );
  });

  it("rejects streamed bodies once they exceed the limit", async () => {
    const response = createBodySource("abcdef");

    await expect(readLimitedText(response, 5)).rejects.toBeInstanceOf(
      BodyTooLargeError
    );
  });

  it("parses JSON only after the bounded text read", async () => {
    const response = createBodySource(JSON.stringify({ ok: true }), {
      "content-type": "application/json",
    });

    await expect(readLimitedJson(response, 16)).resolves.toEqual({ ok: true });
  });

  it("recognizes JSON and HTML content types", () => {
    expect(isJsonContentType("application/activity+json")).toBe(true);
    expect(isJsonContentType("text/plain")).toBe(false);
    expect(isTolerantJsonContentType("text/plain")).toBe(true);
    expect(isJsonContentType("text/html")).toBe(false);
    expect(isHtmlContentType("text/html; charset=utf-8")).toBe(true);
    expect(isHtmlContentType("text/plain")).toBe(true);
    expect(isHtmlContentType("application/json")).toBe(false);
  });

  it("throws for unsupported content types", () => {
    expect(() =>
      assertContentType(
        new Headers({ "content-type": "image/png" }),
        isHtmlContentType,
        "HTML"
      )
    ).toThrow(UnsupportedContentTypeError);
  });
});
