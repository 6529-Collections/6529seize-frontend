import type { ApiArtworkDocumentationCompletePart } from "@/generated/models/ApiArtworkDocumentationCompletePart";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import {
  completeDocumentationUpload,
  signDocumentationParts,
} from "@/services/api/artwork-documentation-assets-api";

export class DocumentationFileChangedError extends Error {
  constructor() {
    super("UPLOAD_FILE_CHANGED");
    this.name = "DocumentationFileChangedError";
  }
}
export async function sha256Base64(blob: Blob): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())
  );
  return btoa(String.fromCharCode(...digest));
}

export async function transferDocumentationFile({
  contextId,
  session,
  file,
  signal,
  onProgress,
}: {
  readonly contextId: string;
  readonly session: ApiArtworkDocumentationUploadSession;
  readonly file: File;
  readonly signal: AbortSignal;
  readonly onProgress: (bytes: number) => void;
}) {
  if (file.size !== session.asset.size_bytes)
    throw new DocumentationFileChangedError();
  const partSize = Number(session.policy["part_size_bytes"]);
  if (!partSize || partSize > 64 * 1024 * 1024)
    throw new Error("INVALID_PART_POLICY");
  const count = Math.ceil(file.size / partSize);
  const completed = new Map<number, ApiArtworkDocumentationCompletePart>();
  let sent = 0;
  for (const received of session.received_parts) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const start = (received.part_number - 1) * partSize;
    const bytes = file.slice(start, Math.min(start + partSize, file.size));
    if ((await sha256Base64(bytes)) !== received.checksum_sha256)
      throw new DocumentationFileChangedError();
    completed.set(received.part_number, received);
    sent += bytes.size;
    onProgress(sent);
  }
  const remaining = Array.from(
    { length: count },
    (_, index) => index + 1
  ).filter((part) => !completed.has(part));
  const parallel = Math.max(
    1,
    Math.min(Number(session.policy["parallel_parts"]) || 3, 3)
  );
  let cursor = 0;
  const transfer = async () => {
    while (cursor < remaining.length) {
      const partNumber = remaining[cursor++];
      if (partNumber === undefined) return;
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const start = (partNumber - 1) * partSize;
      const bytes = file.slice(start, Math.min(start + partSize, file.size));
      const checksum = await sha256Base64(bytes);
      const signed = await signDocumentationParts(
        contextId,
        session.upload_id,
        [{ part_number: partNumber, checksum_sha256: checksum }],
        signal
      );
      const part = signed.parts[0];
      if (!part) throw new Error("MISSING_SIGNED_PART");
      const response = await fetch(part.url, {
        method: "PUT",
        body: bytes,
        headers: part.headers,
        signal,
      });
      const etag = response.headers.get("etag");
      if (!response.ok || !etag) throw new Error("PART_UPLOAD_FAILED");
      completed.set(partNumber, {
        part_number: partNumber,
        checksum_sha256: checksum,
        etag,
      });
      sent += bytes.size;
      onProgress(sent);
    }
  };
  await Promise.all(Array.from({ length: parallel }, transfer));
  return completeDocumentationUpload(
    contextId,
    session.upload_id,
    [...completed.values()].sort((a, b) => a.part_number - b.part_number),
    crypto.randomUUID(),
    signal
  );
}
