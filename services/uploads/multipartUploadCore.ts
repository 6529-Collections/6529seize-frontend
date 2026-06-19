import axios, { CanceledError, isCancel } from "axios";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";
import { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  getContentType,
  toApiMediaUploadMimeType,
} from "@/services/uploads/mediaUploadMimeType";
import type { ApiCreateMediaUploadUrlRequest } from "@/generated/models/ApiCreateMediaUploadUrlRequest";
import type { ApiStartMultipartMediaUploadResponse } from "@/generated/models/ApiStartMultipartMediaUploadResponse";
import type { ApiUploadPartOfMultipartUploadRequest } from "@/generated/models/ApiUploadPartOfMultipartUploadRequest";
import type { ApiUploadPartOfMultipartUploadResponse } from "@/generated/models/ApiUploadPartOfMultipartUploadResponse";
import type { ApiCompleteMultipartUploadRequest } from "@/generated/models/ApiCompleteMultipartUploadRequest";
import type { ApiCompleteMultipartUploadResponse } from "@/generated/models/ApiCompleteMultipartUploadResponse";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiCreateAttachmentMultipartUploadRequest } from "@/generated/models/ApiCreateAttachmentMultipartUploadRequest";
import type { ApiCreateAttachmentMultipartUploadResponse } from "@/generated/models/ApiCreateAttachmentMultipartUploadResponse";
import type { ApiCompleteAttachmentMultipartUploadRequest } from "@/generated/models/ApiCompleteAttachmentMultipartUploadRequest";
import { getApiAttachmentUploadMimeType } from "@/services/uploads/attachmentUploadMimeType";
import { t } from "@/i18n/messages";
import { DEFAULT_LOCALE } from "@/i18n/locales";

const PART_SIZE = 5 * 1024 * 1024;
const CONCURRENCY = 5;
const RETRIES = 3;
const MIN_TIMEOUT = 1000;
const MEDIA_READY_POLL_DELAY_MS = 1500;
const MEDIA_READY_POLL_ATTEMPTS = 80;

interface MultipartUploadEndpoints {
  start: string;
  part: string;
  complete: string;
}

interface MultipartUploadCoreParams {
  file: File;
  endpoints: MultipartUploadEndpoints;
  onProgress?: ((bytesUploaded: number) => void) | undefined;
  onCompleting?: (() => void) | undefined;
  waitForReady?: boolean | undefined;
  signal?: AbortSignal | undefined;
}

export {
  getContentType,
  toApiMediaUploadMimeType,
} from "@/services/uploads/mediaUploadMimeType";

export function getApiMediaUploadMimeType(file: File): ApiMediaUploadMimeType {
  const contentType = getContentType(file);
  const apiContentType = toApiMediaUploadMimeType(contentType);

  if (!apiContentType) {
    throw new Error(`Unsupported file type for upload: ${file.name}`);
  }

  return apiContentType;
}

async function uploadMultipartParts({
  file,
  uploadId,
  key,
  contentType,
  partEndpoint,
  onProgress,
  signal,
}: {
  readonly file: File;
  readonly uploadId: string;
  readonly key: string;
  readonly contentType: string;
  readonly partEndpoint: string;
  readonly onProgress?: ((bytesUploaded: number) => void) | undefined;
  readonly signal?: AbortSignal | undefined;
}): Promise<Array<{ eTag: string; partNumber: number }>> {
  const totalParts = Math.ceil(file.size / PART_SIZE);
  const limit = pLimit(CONCURRENCY);

  const partPromises: Array<Promise<{ eTag: string; partNumber: number }>> = [];
  const partProgress = new Map<number, number>();

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const startByte = (partNumber - 1) * PART_SIZE;
    const endByte = Math.min(startByte + PART_SIZE, file.size);
    const blobPart = file.slice(startByte, endByte);

    const uploadChunk = async () => {
      if (signal?.aborted) {
        throw new AbortError("Upload aborted");
      }

      const previousProgress = partProgress.get(partNumber) ?? 0;
      if (previousProgress > 0 && onProgress) {
        // Remove any bytes counted from a failed prior attempt for this part
        onProgress(-previousProgress);
      }

      let lastChunkLoaded = 0;
      partProgress.set(partNumber, 0);

      try {
        const partResp = await commonApiPost<
          ApiUploadPartOfMultipartUploadRequest,
          ApiUploadPartOfMultipartUploadResponse
        >({
          endpoint: partEndpoint,
          body: {
            upload_id: uploadId,
            key,
            part_no: partNumber,
          },
          ...(signal ? { signal } : {}),
        });

        const { upload_url } = partResp;
        if (!upload_url) {
          throw new Error("No upload_url returned for part " + partNumber);
        }

        const s3Resp = await axios.put(upload_url, blobPart, {
          headers: {
            "Content-Type": contentType,
          },
          ...(signal ? { signal } : {}),
          onUploadProgress: (event) => {
            if (event.loaded !== undefined && onProgress) {
              const chunkDelta = Math.max(event.loaded - lastChunkLoaded, 0);
              lastChunkLoaded = event.loaded;
              partProgress.set(partNumber, event.loaded);
              onProgress(chunkDelta);
            }
          },
        });

        const eTagHeader = s3Resp.headers["etag"];
        const eTag = eTagHeader ? eTagHeader.replaceAll('"', "") : "";
        if (!eTag) {
          throw new Error(`No ETag returned for part ${partNumber}`);
        }

        return { eTag, partNumber };
      } catch (error: unknown) {
        if (
          signal?.aborted ||
          isCancel(error) ||
          error instanceof CanceledError ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          throw new AbortError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
        throw error;
      }
    };

    const chunkPromise = limit(() =>
      pRetry(uploadChunk, {
        retries: RETRIES,
        factor: 2,
        minTimeout: MIN_TIMEOUT,
      })
    );
    partPromises.push(chunkPromise);
  }

  return await Promise.all(partPromises);
}

const sleep = (delayMs: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AbortError("Upload aborted"));
      return;
    }

    const timeout = globalThis.setTimeout(resolve, delayMs);
    signal?.addEventListener(
      "abort",
      () => {
        globalThis.clearTimeout(timeout);
        reject(new AbortError("Upload aborted"));
      },
      { once: true }
    );
  });

function isAbortError(error: unknown): boolean {
  return (
    (typeof isCancel === "function" && isCancel(error)) ||
    (typeof CanceledError === "function" && error instanceof CanceledError) ||
    (error instanceof DOMException && error.name === "AbortError")
  );
}

function getImageProcessingFailedMessage(
  response: ApiCompleteMultipartUploadResponse
): string {
  return (
    response.media_error ?? t(DEFAULT_LOCALE, "drop.media.processingFailed")
  );
}

function assertImageProcessingDidNotFail(
  response: ApiCompleteMultipartUploadResponse
): void {
  if (response.media_status === ApiDropMediaStatus.Failed) {
    throw new Error(getImageProcessingFailedMessage(response));
  }
}

async function waitForMediaReady(
  completionData: ApiCompleteMultipartUploadResponse,
  signal?: AbortSignal
): Promise<ApiCompleteMultipartUploadResponse> {
  if (!completionData.media_upload_id) {
    return completionData;
  }

  assertImageProcessingDidNotFail(completionData);

  if (
    completionData.media_status === undefined ||
    completionData.media_status === ApiDropMediaStatus.Ready
  ) {
    return completionData;
  }

  let lastPollError: unknown;
  for (let attempt = 0; attempt < MEDIA_READY_POLL_ATTEMPTS; attempt++) {
    await sleep(MEDIA_READY_POLL_DELAY_MS, signal);

    let status: ApiCompleteMultipartUploadResponse;
    try {
      status = await commonApiFetch<ApiCompleteMultipartUploadResponse>({
        endpoint: `drop-media/uploads/${completionData.media_upload_id}`,
        ...(signal ? { signal } : {}),
      });
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) {
        throw error;
      }
      lastPollError = error;
      continue;
    }

    if (status.media_status === ApiDropMediaStatus.Ready) {
      return status;
    }

    assertImageProcessingDidNotFail(status);
  }

  if (lastPollError instanceof Error) {
    throw lastPollError;
  }
  throw new Error(t(DEFAULT_LOCALE, "drop.media.processingTimedOut"));
}

export async function multipartUploadCore({
  file,
  endpoints,
  onProgress,
  onCompleting,
  waitForReady = false,
  signal,
}: MultipartUploadCoreParams): Promise<ApiCompleteMultipartUploadResponse> {
  const contentType = getApiMediaUploadMimeType(file);

  const startData = await commonApiPost<
    ApiCreateMediaUploadUrlRequest,
    ApiStartMultipartMediaUploadResponse
  >({
    endpoint: endpoints.start,
    body: {
      file_name: file.name,
      content_type: contentType,
    },
    ...(signal ? { signal } : {}),
  });

  const { upload_id, key } = startData;
  if (!upload_id || !key) {
    throw new Error("Server did not return required upload_id or key");
  }

  const uploadedParts = await uploadMultipartParts({
    file,
    uploadId: upload_id,
    key,
    contentType,
    partEndpoint: endpoints.part,
    onProgress,
    signal,
  });

  onCompleting?.();

  const completionData = await commonApiPost<
    ApiCompleteMultipartUploadRequest,
    ApiCompleteMultipartUploadResponse
  >({
    endpoint: endpoints.complete,
    body: {
      upload_id,
      key,
      parts: uploadedParts.map((p) => ({
        part_no: p.partNumber,
        etag: p.eTag,
      })),
    },
    ...(signal ? { signal } : {}),
  });

  const { media_url } = completionData;
  if (!media_url) {
    throw new Error("No final media_url returned from completion endpoint");
  }

  assertImageProcessingDidNotFail(completionData);

  return waitForReady
    ? await waitForMediaReady(completionData, signal)
    : completionData;
}

export async function multipartAttachmentUploadCore({
  file,
  endpoints,
  onProgress,
  signal,
}: MultipartUploadCoreParams): Promise<ApiAttachment> {
  const contentType = getApiAttachmentUploadMimeType(file);

  if (!contentType) {
    throw new Error(`Unsupported attachment type for upload: ${file.name}`);
  }

  const startData = await commonApiPost<
    ApiCreateAttachmentMultipartUploadRequest,
    ApiCreateAttachmentMultipartUploadResponse
  >({
    endpoint: endpoints.start,
    body: {
      file_name: file.name,
      content_type: contentType,
    },
    ...(signal ? { signal } : {}),
  });

  const { attachment_id, upload_id, key } = startData;
  if (!attachment_id || !upload_id || !key) {
    throw new Error(
      "Server did not return required attachment_id, upload_id, or key"
    );
  }

  const uploadedParts = await uploadMultipartParts({
    file,
    uploadId: upload_id,
    key,
    contentType,
    partEndpoint: endpoints.part,
    onProgress,
    signal,
  });

  return await commonApiPost<
    ApiCompleteAttachmentMultipartUploadRequest,
    ApiAttachment
  >({
    endpoint: endpoints.complete,
    body: {
      attachment_id,
      upload_id,
      key,
      parts: uploadedParts.map((p) => ({
        part_no: p.partNumber,
        etag: p.eTag,
      })),
    },
    ...(signal ? { signal } : {}),
  });
}
