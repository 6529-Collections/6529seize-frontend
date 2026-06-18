/**
 * Error thrown when a request or response body exceeds the configured byte cap.
 */
export class BodyTooLargeError extends Error {
  readonly statusCode = 413;
  readonly maxBytes: number;

  constructor(maxBytes: number) {
    super(`Body exceeds maximum size of ${maxBytes} bytes.`);
    this.name = "BodyTooLargeError";
    this.maxBytes = maxBytes;
  }
}

/**
 * Error thrown when a response or request content type is missing or unsupported.
 */
export class UnsupportedContentTypeError extends Error {
  readonly statusCode = 415;
  readonly contentType: string | null;

  constructor(contentType: string | null, expected: string) {
    super(
      contentType
        ? `Unsupported content type "${contentType}". Expected ${expected}.`
        : `Missing content type. Expected ${expected}.`
    );
    this.name = "UnsupportedContentTypeError";
    this.contentType = contentType;
  }
}

type BodySource = {
  readonly body: ReadableStream<Uint8Array> | null;
  readonly headers: Headers;
};

type ContentTypeOptions = {
  readonly allowMissing?: boolean | undefined;
};

type ContentTypePredicate = (contentType: string) => boolean;

/**
 * Extracts the lowercase MIME type from a content-type header value.
 */
function parseContentType(contentType: string): string {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

/**
 * Returns true for JSON-like MIME types.
 */
export function isJsonContentType(contentType: string): boolean {
  const mimeType = parseContentType(contentType);
  return (
    mimeType === "application/json" ||
    mimeType === "text/json" ||
    mimeType.endsWith("+json")
  );
}

/**
 * Returns true for JSON-like MIME types, including text/plain fallbacks.
 */
export function isTolerantJsonContentType(contentType: string): boolean {
  return (
    isJsonContentType(contentType) ||
    parseContentType(contentType) === "text/plain"
  );
}

/**
 * Returns true for HTML/XML-like MIME types, including text/plain fallbacks.
 */
export function isHtmlContentType(contentType: string): boolean {
  const mimeType = parseContentType(contentType);
  return (
    mimeType === "text/html" ||
    mimeType === "text/plain" ||
    mimeType === "application/xhtml+xml" ||
    mimeType === "application/xml" ||
    mimeType === "text/xml" ||
    mimeType.endsWith("+xml")
  );
}

/**
 * Validates a content-type header with a caller-supplied predicate.
 */
export function assertContentType(
  headers: Headers,
  predicate: ContentTypePredicate,
  expected: string,
  options: ContentTypeOptions = {}
): string | null {
  const contentType = headers.get("content-type");

  if (!contentType) {
    if (options.allowMissing) {
      return null;
    }
    throw new UnsupportedContentTypeError(null, expected);
  }

  if (!predicate(contentType)) {
    throw new UnsupportedContentTypeError(contentType, expected);
  }

  return contentType;
}

/**
 * Parses a trustworthy content-length header, ignoring malformed values.
 */
function parseContentLength(headers: Headers): number | null {
  const rawContentLength = headers.get("content-length");
  if (!rawContentLength) {
    return null;
  }

  const normalizedContentLength = rawContentLength.trim();
  if (!/^\d+$/.test(normalizedContentLength)) {
    return null;
  }

  const contentLength = Number.parseInt(normalizedContentLength, 10);
  return Number.isFinite(contentLength) && contentLength >= 0
    ? contentLength
    : null;
}

/**
 * Rejects bodies whose declared content length already exceeds the byte cap.
 */
function assertReadableSize(headers: Headers, maxBytes: number): void {
  const contentLength = parseContentLength(headers);
  if (contentLength !== null && contentLength > maxBytes) {
    throw new BodyTooLargeError(maxBytes);
  }
}

/**
 * Cancels an overflowing stream without masking the original read failure.
 */
async function cancelReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
): Promise<void> {
  try {
    await reader.cancel();
  } catch {
    // Best effort only; the caller is already rejecting the read.
  }
}

/**
 * Reads a Web body stream as text while enforcing a maximum byte count.
 */
export async function readLimitedText(
  source: BodySource,
  maxBytes: number
): Promise<string> {
  assertReadableSize(source.headers, maxBytes);

  if (!source.body) {
    return "";
  }

  const reader = source.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await cancelReader(reader);
        throw new BodyTooLargeError(maxBytes);
      }

      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }

  text += decoder.decode();
  return text;
}

/**
 * Reads a Web body stream with a byte cap, then parses the bounded text as JSON.
 */
export async function readLimitedJson<T>(
  source: BodySource,
  maxBytes: number
): Promise<T> {
  return JSON.parse(await readLimitedText(source, maxBytes)) as T;
}
