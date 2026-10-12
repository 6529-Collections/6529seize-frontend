import { pdfjs } from "react-pdf";
import type { PDFDataRangeTransport } from "pdfjs-dist";

// Keep the existing preview limit; larger files remain available via Open full PDF.
export const PDF_PREVIEW_MAX_BYTES = 50 * 1024 * 1024;
export const PDF_PREVIEW_TIMEOUT_MS = 120_000;
export const PDF_RANGE_CHUNK_SIZE = 64 * 1024;
export type PdfPreviewFile =
  | { data: Uint8Array }
  | { range: PDFDataRangeTransport };

export class PdfPreviewSizeError extends Error {
  constructor() {
    super("PDF preview size limit exceeded");
    this.name = "PdfPreviewSizeError";
  }
}

function requestPdf(
  url: string,
  signal: AbortSignal,
  begin?: number,
  end?: number
) {
  return fetch(url, {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    ...(begin !== undefined && end !== undefined
      ? { headers: { Range: `bytes=${begin}-${end - 1}` } }
      : {}),
  });
}

async function readBytes(
  response: Response,
  signal: AbortSignal,
  limit: number
): Promise<Uint8Array> {
  if (!response.ok) throw new Error("PDF request failed");
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw limit === PDF_PREVIEW_MAX_BYTES
      ? new PdfPreviewSizeError()
      : new Error("Oversized PDF range response");
  }
  if (!response.body) throw new Error("PDF response has no body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    let result = await reader.read();
    while (!result.done) {
      signal.throwIfAborted();
      size += result.value.byteLength;
      if (size > limit)
        throw limit === PDF_PREVIEW_MAX_BYTES
          ? new PdfPreviewSizeError()
          : new Error("Oversized PDF range response");
      chunks.push(result.value);
      result = await reader.read();
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // Cancellation must not replace the original size, network or abort error.
    } finally {
      reader.releaseLock();
    }
  }
  signal.throwIfAborted();
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return data;
}

async function readRange(
  response: Response,
  signal: AbortSignal,
  begin: number,
  end: number,
  expectedLength?: number
) {
  const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(
    response.headers.get("content-range") ?? ""
  );
  const [start, last, length] = (match?.slice(1) ?? []).map(Number);
  if (
    response.status !== 206 ||
    start !== begin ||
    last === undefined ||
    length === undefined ||
    !Number.isSafeInteger(length) ||
    length <= begin ||
    last !== Math.min(end, length) - 1 ||
    (expectedLength !== undefined && length !== expectedLength)
  ) {
    await response.body?.cancel();
    throw new Error("Invalid PDF range response");
  }
  if (length > PDF_PREVIEW_MAX_BYTES) {
    await response.body?.cancel();
    throw new PdfPreviewSizeError();
  }
  const data = await readBytes(response, signal, last - begin + 1);
  if (data.length !== last - begin + 1)
    throw new Error("Incomplete PDF range response");
  return { data, length };
}

export async function fetchPdfPreview(
  url: string,
  signal: AbortSignal,
  onError: (cause: unknown) => void
): Promise<PdfPreviewFile> {
  const response = await requestPdf(url, signal, 0, PDF_RANGE_CHUNK_SIZE);
  if (response.status !== 206)
    return { data: await readBytes(response, signal, PDF_PREVIEW_MAX_BYTES) };

  // Some hosts support ranges but do not expose Content-Range through CORS.
  // Preserve the bounded full-download fallback for those hosts.
  if (!response.headers.has("content-range")) {
    await response.body?.cancel();
    return {
      data: await readBytes(
        await requestPdf(url, signal),
        signal,
        PDF_PREVIEW_MAX_BYTES
      ),
    };
  }
  const { data, length } = await readRange(
    response,
    signal,
    0,
    PDF_RANGE_CHUNK_SIZE
  );
  if (data.length === length) return { data };

  // PDF.js chooses and caches the chunks. This adapter keeps our existing
  // no-referrer, size-limit, timeout and cancellation rules for every request.
  const transport = new pdfjs.PDFDataRangeTransport(length, data, true);
  const controller = new AbortController();
  const abort = () => {
    signal.removeEventListener("abort", abort);
    controller.abort();
  };
  transport.abort = abort;
  signal.addEventListener("abort", abort, { once: true });
  signal.throwIfAborted();
  const fail = (cause: unknown) => {
    if (controller.signal.aborted) return;
    abort();
    onError(cause);
  };
  transport.requestDataRange = (begin, end) => {
    if (controller.signal.aborted) return;
    const timeout = globalThis.setTimeout(
      () => fail(new Error("PDF range request timed out")),
      PDF_PREVIEW_TIMEOUT_MS
    );
    void requestPdf(url, controller.signal, begin, end)
      .then((result) =>
        readRange(result, controller.signal, begin, end, length)
      )
      .then(({ data: chunk }) => {
        if (!controller.signal.aborted) transport.onDataRange(begin, chunk);
      })
      .catch(fail)
      .finally(() => globalThis.clearTimeout(timeout));
  };
  return { range: transport };
}
