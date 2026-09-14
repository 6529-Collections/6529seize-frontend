import { useEffect, useMemo, useState } from "react";

type ExportState =
  | { readonly status: "loading" | "error" }
  | {
      readonly status: "ready";
      readonly file: File;
      readonly previewUrl: string;
    };

interface ExportRequest {
  readonly url: string;
  readonly filename: string;
  readonly attempt: number;
}

interface PreparedExport {
  readonly request: ExportRequest;
  readonly state: ExportState;
}

const MAX_EXPORT_BYTES = 8 * 1024 * 1024;

function assertExportActive(signal: AbortSignal) {
  if (signal.aborted) throw new Error("Artwork export was aborted");
}

async function readExportBlob(response: Response, signal: AbortSignal) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Artwork export body is unavailable");

  let complete = false;
  let cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const contentLength = response.headers.get("content-length");
    if (
      contentLength !== null &&
      (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_EXPORT_BYTES)
    ) {
      throw new Error("Unexpected artwork export size");
    }
    const chunks: BlobPart[] = [];
    let bytes = 0;
    assertExportActive(signal);
    for (;;) {
      const { done, value } = await reader.read();
      assertExportActive(signal);
      if (done) {
        if (bytes === 0) throw new Error("Unexpected artwork export size");
        complete = true;
        return new Blob(chunks, { type: "image/png" });
      }
      bytes += value.byteLength;
      if (bytes > MAX_EXPORT_BYTES) {
        throw new Error("Unexpected artwork export size");
      }
      if (value.byteLength > 0) chunks.push(value);
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    if (!complete) cancel();
    reader.releaseLock();
  }
}

export function useArtworkExport(url: string, filename: string) {
  const [attempt, setAttempt] = useState(0);
  const [prepared, setPrepared] = useState<PreparedExport>();
  const request = useMemo(
    () => ({ url, filename, attempt }),
    [url, filename, attempt]
  );
  const state: ExportState =
    prepared?.request === request ? prepared.state : { status: "loading" };

  useEffect(() => {
    const controller = new AbortController();
    let previewUrl: string | undefined;
    let disposed = false;
    const timeout = globalThis.setTimeout(() => controller.abort(), 30_000);
    const prepare = async () => {
      try {
        const response = await fetch(request.url, {
          signal: controller.signal,
        });
        if (
          !response.ok ||
          response.headers.get("content-type")?.split(";")[0] !== "image/png"
        ) {
          throw new Error("Artwork export is unavailable");
        }
        const blob = await readExportBlob(response, controller.signal);
        if (controller.signal.aborted)
          throw new Error("Artwork export timed out");
        if (disposed) return;
        const file = new File([blob], request.filename, { type: "image/png" });
        previewUrl = URL.createObjectURL(file);
        setPrepared({
          request,
          state: { status: "ready", file, previewUrl },
        });
      } catch {
        controller.abort();
        if (!disposed) setPrepared({ request, state: { status: "error" } });
      } finally {
        globalThis.clearTimeout(timeout);
      }
    };
    void prepare();
    return () => {
      disposed = true;
      controller.abort();
      globalThis.clearTimeout(timeout);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [request]);

  const retry = () => {
    setPrepared(undefined);
    setAttempt((value) => value + 1);
  };
  return { state, retry };
}
