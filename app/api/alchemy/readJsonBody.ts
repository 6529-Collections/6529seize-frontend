import type { NextRequest, NextResponse } from "next/server";

type JsonBodyReadResult<T> =
  | { ok: true; body: T }
  | { ok: false; response: NextResponse };

export async function readJsonBody<T>({
  request,
  maxBodyBytes,
  jsonError,
}: {
  readonly request: NextRequest;
  readonly maxBodyBytes: number;
  readonly jsonError: (message: string, status?: number) => NextResponse;
}): Promise<JsonBodyReadResult<T>> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (
      !Number.isFinite(contentLength) ||
      contentLength < 0 ||
      contentLength > maxBodyBytes
    ) {
      return {
        ok: false,
        response: jsonError("Request body is too large", 413),
      };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, response: jsonError("Invalid JSON payload") };
  }

  const decoder = new TextDecoder();
  let totalBytes = 0;
  let rawBody = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    totalBytes += value.byteLength;
    if (totalBytes > maxBodyBytes) {
      return {
        ok: false,
        response: jsonError("Request body is too large", 413),
      };
    }
    rawBody += decoder.decode(value, { stream: true });
  }

  rawBody += decoder.decode();

  try {
    return { ok: true, body: JSON.parse(rawBody) as T };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON payload") };
  }
}
