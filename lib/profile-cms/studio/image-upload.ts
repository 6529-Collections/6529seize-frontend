import { sha256 } from "js-sha256";

import type { ApiCompleteMultipartUploadResponse } from "@/generated/models/ApiCompleteMultipartUploadResponse";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import { assetSchema, type CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";
import { commonApiFetch } from "@/services/api/common-api";
import {
  multipartUploadCore,
  getContentType,
} from "@/services/uploads/multipartUploadCore";

export const CMS_STUDIO_IMAGE_MAX_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MEDIA_ORIGIN = "https://d3lqz0a4bldqgf.cloudfront.net";

export type CmsStudioImageUploadErrorCode =
  | "invalid_file"
  | "too_large"
  | "upload_failed"
  | "processing_failed"
  | "verification_failed"
  | "invalid_response"
  | "timed_out"
  | "cancelled";

export interface CmsStudioImageUploadReference {
  readonly assetId: string;
  readonly completion: ApiCompleteMultipartUploadResponse;
}

export class CmsStudioImageUploadError extends Error {
  constructor(
    readonly code: CmsStudioImageUploadErrorCode,
    readonly reference?: CmsStudioImageUploadReference
  ) {
    super(`cms.image_upload.${code}`);
    this.name = "CmsStudioImageUploadError";
  }
}

export interface CmsStudioImageUploadOptions {
  readonly assetId: string;
  readonly file?: File;
  readonly resume?: CmsStudioImageUploadReference;
  readonly altText: string;
  readonly rights?: string;
  readonly signal: AbortSignal;
  readonly onProgress?: (fraction: number) => void;
  readonly onState?: (state: "uploading" | "processing" | "verifying") => void;
  readonly onReference?: (reference: CmsStudioImageUploadReference) => void;
}

function uploadError(code: CmsStudioImageUploadErrorCode): never {
  throw new CmsStudioImageUploadError(code);
}

function assertActive(signal: AbortSignal): void {
  if (signal.aborted) uploadError("cancelled");
}

async function bounded<T>(
  parent: AbortSignal,
  milliseconds: number,
  task: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  assertActive(parent);
  const controller = new AbortController();
  let deadline = false;
  const onParentAbort = () => controller.abort();
  parent.addEventListener("abort", onParentAbort, { once: true });
  const timer = globalThis.setTimeout(() => {
    deadline = true;
    controller.abort();
  }, milliseconds);
  let rejectAbort: (() => void) | undefined;
  const abort = new Promise<never>((_resolve, reject) => {
    rejectAbort = () =>
      reject(
        new CmsStudioImageUploadError(deadline ? "timed_out" : "cancelled")
      );
    controller.signal.addEventListener("abort", rejectAbort, { once: true });
  });
  try {
    return await Promise.race([task(controller.signal), abort]);
  } finally {
    globalThis.clearTimeout(timer);
    parent.removeEventListener("abort", onParentAbort);
    if (rejectAbort)
      controller.signal.removeEventListener("abort", rejectAbort);
    controller.abort();
  }
}

function pause(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    assertActive(signal);
    const onAbort = () => {
      globalThis.clearTimeout(timer);
      reject(new CmsStudioImageUploadError("cancelled"));
    };
    const timer = globalThis.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, 1500);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function mediaUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return uploadError("invalid_response");
  }
  if (
    url.origin !== MEDIA_ORIGIN ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith("/drops/author_")
  ) {
    uploadError("invalid_response");
  }
  return url.href;
}

function validateInput(options: CmsStudioImageUploadOptions): void {
  if (!assetSchema.shape.id.safeParse(options.assetId).success)
    uploadError("invalid_file");
  if (
    !options.altText.trim() ||
    options.altText.length > 2000 ||
    (options.rights?.length ?? 0) > 2000
  ) {
    uploadError("invalid_file");
  }
  if (options.resume) {
    if (options.resume.assetId !== options.assetId)
      uploadError("invalid_response");
    mediaUrl(options.resume.completion.media_url);
    return;
  }
  const file = options.file;
  if (!file || file.size === 0 || !IMAGE_TYPES.has(getContentType(file)))
    uploadError("invalid_file");
  if (file.size > CMS_STUDIO_IMAGE_MAX_BYTES) uploadError("too_large");
}

async function upload(
  options: CmsStudioImageUploadOptions,
  signal: AbortSignal
) {
  if (options.resume) return options.resume.completion;
  const file = options.file;
  if (!file) return uploadError("invalid_file");
  options.onState?.("uploading");
  let sent = 0;
  return await multipartUploadCore({
    file,
    endpoints: {
      start: "drop-media/multipart-upload",
      part: "drop-media/multipart-upload/part",
      complete: "drop-media/multipart-upload/completion",
    },
    waitForReady: false,
    signal,
    onProgress: (delta) => {
      sent = Math.max(0, Math.min(file.size, sent + delta));
      if (!signal.aborted) options.onProgress?.(sent / file.size);
    },
    onCompleting: () => {
      if (!signal.aborted) options.onState?.("processing");
    },
  });
}

async function ready(
  initial: ApiCompleteMultipartUploadResponse,
  signal: AbortSignal,
  checkpoint: (completion: ApiCompleteMultipartUploadResponse) => void
): Promise<ApiCompleteMultipartUploadResponse> {
  let completion = initial;
  for (let attempt = 0; attempt <= 80; attempt++) {
    assertActive(signal);
    if (completion.media_status === ApiDropMediaStatus.Failed)
      uploadError("processing_failed");
    if (
      completion.media_status === ApiDropMediaStatus.Ready ||
      (completion.media_status === undefined && !completion.media_upload_id)
    )
      return completion;
    const id = completion.media_upload_id;
    if (!id) uploadError("invalid_response");
    if (attempt === 80) uploadError("timed_out");
    await pause(signal);
    completion = await commonApiFetch<ApiCompleteMultipartUploadResponse>({
      endpoint: `drop-media/uploads/${encodeURIComponent(id)}`,
      signal,
    });
    assertActive(signal);
    if (completion.media_upload_id !== id) uploadError("invalid_response");
    checkpoint(completion);
  }
  return uploadError("timed_out");
}

async function readBytes(
  response: Response,
  signal: AbortSignal
): Promise<Uint8Array<ArrayBuffer>> {
  const length = Number(response.headers.get("content-length"));
  if (length > CMS_STUDIO_IMAGE_MAX_BYTES) {
    await response.body?.cancel();
    uploadError("too_large");
  }
  if (!response.body) uploadError("verification_failed");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      const value = chunk.value;
      assertActive(signal);
      size += value.byteLength;
      if (size > CMS_STUDIO_IMAGE_MAX_BYTES) uploadError("too_large");
      chunks.push(value);
      chunk = await reader.read();
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  if (!size) uploadError("verification_failed");
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function hasImageSignature(bytes: Uint8Array, mime: string): boolean {
  const begins = (signature: readonly number[], offset = 0) =>
    signature.every((value, i) => bytes[offset + i] === value);
  switch (mime) {
    case "image/png":
      return begins([137, 80, 78, 71, 13, 10, 26, 10]);
    case "image/jpeg":
      return begins([255, 216, 255]);
    case "image/gif":
      return (
        begins([71, 73, 70, 56]) &&
        (bytes[4] === 55 || bytes[4] === 57) &&
        bytes[5] === 97
      );
    case "image/webp":
      return begins([82, 73, 70, 70]) && begins([87, 69, 66, 80], 8);
    default:
      return false;
  }
}

function decodeImage(
  blob: Blob,
  signal: AbortSignal
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    assertActive(signal);
    const url = URL.createObjectURL(blob);
    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      image.src = "";
      URL.revokeObjectURL(url);
      signal.removeEventListener("abort", onAbort);
    };
    const fail = (code: CmsStudioImageUploadErrorCode) => {
      cleanup();
      reject(new CmsStudioImageUploadError(code));
    };
    const onAbort = () => fail("cancelled");
    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      if (
        !Number.isSafeInteger(width) ||
        !Number.isSafeInteger(height) ||
        width < 1 ||
        height < 1
      ) {
        fail("verification_failed");
        return;
      }
      cleanup();
      resolve({ width, height });
    };
    image.onerror = () => fail("verification_failed");
    signal.addEventListener("abort", onAbort, { once: true });
    image.src = url;
  });
}

async function verifyImage(url: string, signal: AbortSignal) {
  const downloaded = await bounded(signal, 30_000, async (downloadSignal) => {
    const response = await fetch(url, {
      signal: downloadSignal,
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
    if (response.status !== 200) {
      await response.body?.cancel();
      uploadError("verification_failed");
    }
    const mime =
      response.headers
        .get("content-type")
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase() ?? "";
    if (!IMAGE_TYPES.has(mime)) {
      await response.body?.cancel();
      uploadError("verification_failed");
    }
    const bytes = await readBytes(response, downloadSignal);
    if (!hasImageSignature(bytes, mime)) uploadError("verification_failed");
    return { bytes, mime };
  });
  const dimensions = await bounded(
    signal,
    10_000,
    async (decodeSignal) =>
      await decodeImage(
        new Blob([downloaded.bytes], { type: downloaded.mime }),
        decodeSignal
      )
  );
  return {
    ...dimensions,
    mime_type: downloaded.mime,
    file_size_bytes: downloaded.bytes.byteLength,
    content_hash: `sha256:${sha256(downloaded.bytes)}`,
  };
}

/** Upload once, then verify the exact public bytes produced by image processing. */
export async function uploadCmsStudioImage(
  options: CmsStudioImageUploadOptions
): Promise<CmsAssetV1> {
  let reference = options.resume;
  let failure: CmsStudioImageUploadErrorCode = "upload_failed";
  try {
    validateInput(options);
    return await bounded(options.signal, 180_000, async (signal) => {
      const checkpoint = (completion: ApiCompleteMultipartUploadResponse) => {
        assertActive(signal);
        mediaUrl(completion.media_url);
        reference = { assetId: options.assetId, completion: { ...completion } };
        options.onReference?.(reference);
      };
      const completion = await upload(options, signal);
      checkpoint(completion);
      failure = "processing_failed";
      options.onState?.("processing");
      const result = await ready(completion, signal, checkpoint);
      failure = "verification_failed";
      options.onState?.("verifying");
      const uri = mediaUrl(result.media_url);
      const verified = await verifyImage(uri, signal);
      assertActive(signal);
      const asset = assetSchema.safeParse({
        id: options.assetId,
        kind: "image",
        uri,
        ...verified,
        alt_text: options.altText.trim(),
        ...(options.rights?.trim() ? { rights: options.rights.trim() } : {}),
      });
      if (!asset.success) uploadError("invalid_response");
      return asset.data;
    });
  } catch (error) {
    throw new CmsStudioImageUploadError(
      error instanceof CmsStudioImageUploadError ? error.code : failure,
      reference
    );
  }
}
