import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import {
  multipartUploadCore,
  multipartAttachmentUploadCore,
  getContentType,
} from "@/services/uploads/multipartUploadCore";
import {
  isAttachmentUploadFile,
  validateAttachmentUploadFile,
} from "@/services/uploads/attachmentUploadMimeType";

const MAX_FILE_SIZE = 500 * 1024 * 1024;

interface MultiPartUploadParams {
  file: File;
  path: "drop" | "wave";
  onProgress?: ((progressPercent: number) => void) | undefined;
  onProcessing?: (() => void) | undefined;
  waitForReady?: boolean | undefined;
  signal?: AbortSignal | undefined;
}

function assertNonEmptyFile(
  file: File,
  onProgress?: ((progressPercent: number) => void) | undefined
): void {
  if (file.size !== 0) {
    return;
  }
  if (onProgress) {
    onProgress(100);
  }
  throw new Error("Empty file uploads are not allowed");
}

function createProgressHandler(
  file: File,
  onProgress?: ((progressPercent: number) => void) | undefined
): (bytesUploaded: number) => void {
  let overallUploaded = 0;

  return (bytesUploaded: number) => {
    overallUploaded = Math.max(overallUploaded + bytesUploaded, 0);
    if (onProgress) {
      const percent = Math.floor((overallUploaded / file.size) * 100);
      onProgress(Math.min(Math.max(percent, 0), 100));
    }
  };
}

export async function multiPartUpload({
  file,
  path,
  onProgress,
  onProcessing,
  waitForReady = true,
  signal,
}: MultiPartUploadParams): Promise<ApiDropMedia> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum allowed size of 500 MB");
  }

  const contentType = getContentType(file);

  assertNonEmptyFile(file, onProgress);

  const completion = await multipartUploadCore({
    file,
    endpoints: {
      start: `${path}-media/multipart-upload`,
      part: `${path}-media/multipart-upload/part`,
      complete: `${path}-media/multipart-upload/completion`,
    },
    onProgress: createProgressHandler(file, onProgress),
    onCompleting: onProcessing,
    waitForReady,
    signal,
  });

  const media: ApiDropMedia = {
    url: completion.media_url,
    mime_type: contentType,
  };

  if (typeof completion.media_upload_id === "string") {
    media.media_upload_id = completion.media_upload_id;
  }
  if (typeof completion.media_status === "string") {
    media.media_status = completion.media_status;
  }
  if (typeof completion.media_error === "string") {
    media.media_error = completion.media_error;
  }

  return media;
}

export async function multiPartAttachmentUpload({
  file,
  onProgress,
  signal,
}: Omit<MultiPartUploadParams, "path">): Promise<ApiAttachment> {
  if (!isAttachmentUploadFile(file)) {
    throw new Error("File type not supported.");
  }

  validateAttachmentUploadFile(file);

  assertNonEmptyFile(file, onProgress);

  return await multipartAttachmentUploadCore({
    file,
    endpoints: {
      start: "attachments/multipart-upload",
      part: "attachments/multipart-upload/part",
      complete: "attachments/multipart-upload/completion",
    },
    onProgress: createProgressHandler(file, onProgress),
    signal,
  });
}
