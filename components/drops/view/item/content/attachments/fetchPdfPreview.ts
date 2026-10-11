// Bound memory on phones; larger documents remain available through Open full PDF.
export const PDF_PREVIEW_MAX_BYTES = 50 * 1024 * 1024;
export const PDF_PREVIEW_TIMEOUT_MS = 120_000;

export class PdfPreviewSizeError extends Error {
  constructor() {
    super("PDF preview size limit exceeded");
    this.name = "PdfPreviewSizeError";
  }
}

export async function fetchPdfPreview(
  url: string,
  signal: AbortSignal
): Promise<Uint8Array> {
  const response = await fetch(url, {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error("PDF request failed");
  if (Number(response.headers.get("content-length")) > PDF_PREVIEW_MAX_BYTES) {
    await response.body?.cancel();
    throw new PdfPreviewSizeError();
  }
  if (!response.body) throw new Error("PDF response has no body");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    let result = await reader.read();
    while (!result.done) {
      const { value } = result;
      signal.throwIfAborted();
      size += value.byteLength;
      if (size > PDF_PREVIEW_MAX_BYTES) throw new PdfPreviewSizeError();
      chunks.push(value);
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
