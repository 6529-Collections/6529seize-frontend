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

/**
 * Creates a stream that yields each byte chunk on its own read.
 */
function createChunkedBody(
  chunks: Uint8Array[],
  cancel: () => void = () => undefined
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      const next = chunks.shift();
      if (next) {
        controller.enqueue(next);
      } else {
        controller.close();
      }
    },
    cancel,
  });
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

  it("can return the first bytes of a longer body instead of rejecting it", async () => {
    const cancel = jest.fn();
    const chunks = ["<head>ab", "cdef</head>", "never read"].map((chunk) =>
      new TextEncoder().encode(chunk)
    );
    const source = {
      body: createChunkedBody(chunks, cancel),
      headers: new Headers({ "content-length": "999999" }),
    };

    await expect(readLimitedText(source, 12, { truncate: true })).resolves.toBe(
      "<head>abcdef"
    );
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("keeps a multi-byte character split across chunks", async () => {
    // "é" is two bytes in UTF-8 (0xC3 0xA9); the split falls between them.
    const bytes = new TextEncoder().encode("café");
    const source = {
      body: createChunkedBody([bytes.subarray(0, 4), bytes.subarray(4)]),
      headers: new Headers(),
    };

    await expect(readLimitedText(source, 16)).resolves.toBe("café");
  });

  it("flushes the decoder when the body ends inside a multi-byte character", async () => {
    const bytes = new TextEncoder().encode("café");
    const source = {
      body: createChunkedBody([bytes.subarray(0, 4)]),
      headers: new Headers(),
    };

    // The incomplete trailing sequence becomes U+FFFD instead of vanishing.
    await expect(readLimitedText(source, 16)).resolves.toBe("caf\uFFFD");
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
