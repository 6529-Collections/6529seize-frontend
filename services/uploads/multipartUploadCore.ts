import axios from "axios";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { commonApiPost } from "@/services/api/common-api";
import { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";
import type { ApiStartMultipartMediaUploadResponse } from "@/generated/models/ApiStartMultipartMediaUploadResponse";
import type { ApiUploadPartOfMultipartUploadRequest } from "@/generated/models/ApiUploadPartOfMultipartUploadRequest";
import type { ApiUploadPartOfMultipartUploadResponse } from "@/generated/models/ApiUploadPartOfMultipartUploadResponse";
import type { ApiCompleteMultipartUploadRequest } from "@/generated/models/ApiCompleteMultipartUploadRequest";
import type { ApiCompleteMultipartUploadResponse } from "@/generated/models/ApiCompleteMultipartUploadResponse";

const PART_SIZE = 5 * 1024 * 1024;
const CONCURRENCY = 5;
const RETRIES = 3;
const MIN_TIMEOUT = 1000;

interface MultipartUploadEndpoints {
  start: string;
  part: string;
  complete: string;
}

interface MultipartUploadCoreParams {
  file: File;
  endpoints: MultipartUploadEndpoints;
  onProgress?: ((bytesUploaded: number) => void) | undefined;
}

interface MediaUploadUrlRequest {
  content_type: ApiMediaUploadMimeType;
  file_name: string;
}

const SUPPORTED_MIME_TYPES = new Set<string>(
  Object.values(ApiMediaUploadMimeType)
);

const EXTENSION_MIME_TYPES: Record<string, ApiMediaUploadMimeType> = {
  ".aac": ApiMediaUploadMimeType.AudioAac,
  ".avi": ApiMediaUploadMimeType.VideoXMsvideo,
  ".csv": ApiMediaUploadMimeType.TextCsv,
  ".gif": ApiMediaUploadMimeType.ImageGif,
  ".glb": ApiMediaUploadMimeType.ModelGltfBinary,
  ".jpeg": ApiMediaUploadMimeType.ImageJpeg,
  ".jpg": ApiMediaUploadMimeType.ImageJpeg,
  ".mov": ApiMediaUploadMimeType.VideoQuicktime,
  ".mp3": ApiMediaUploadMimeType.AudioMpeg,
  ".mp4": ApiMediaUploadMimeType.VideoMp4,
  ".ogg": ApiMediaUploadMimeType.AudioOgg,
  ".pdf": ApiMediaUploadMimeType.ApplicationPdf,
  ".png": ApiMediaUploadMimeType.ImagePng,
  ".wav": ApiMediaUploadMimeType.AudioWav,
  ".webp": ApiMediaUploadMimeType.ImageWebp,
};

function getSupportedMimeType(
  contentType: string
): ApiMediaUploadMimeType | null {
  const normalizedContentType = contentType.trim().toLowerCase();
  if (!normalizedContentType) {
    return null;
  }

  if (SUPPORTED_MIME_TYPES.has(normalizedContentType)) {
    return normalizedContentType as ApiMediaUploadMimeType;
  }

  return null;
}

function getContentTypeFromFileName(
  fileName: string
): ApiMediaUploadMimeType | null {
  const normalizedFileName = fileName.toLowerCase();
  const extensionIndex = normalizedFileName.lastIndexOf(".");
  if (extensionIndex === -1) {
    return null;
  }

  const extension = normalizedFileName.slice(extensionIndex);
  return EXTENSION_MIME_TYPES[extension] ?? null;
}

export function getContentType(file: File): ApiMediaUploadMimeType {
  if (file.type) {
    const contentType = getSupportedMimeType(file.type);
    if (contentType !== null) {
      return contentType;
    }

    throw new Error(
      `Unsupported media upload MIME type: ${file.type} for file "${file.name}"`
    );
  }

  const contentTypeFromFileName = getContentTypeFromFileName(file.name);
  if (contentTypeFromFileName !== null) {
    return contentTypeFromFileName;
  }

  throw new Error(
    `Unsupported media upload MIME type: unknown for file "${file.name}"`
  );
}

export async function multipartUploadCore({
  file,
  endpoints,
  onProgress,
}: MultipartUploadCoreParams): Promise<string> {
  const contentType = getContentType(file);

  const startData = await commonApiPost<
    MediaUploadUrlRequest,
    ApiStartMultipartMediaUploadResponse
  >({
    endpoint: endpoints.start,
    body: {
      file_name: file.name,
      content_type: contentType,
    },
  });

  const { upload_id, key } = startData;
  if (!upload_id || !key) {
    throw new Error("Server did not return required upload_id or key");
  }

  const totalParts = Math.ceil(file.size / PART_SIZE);
  const limit = pLimit(CONCURRENCY);

  const partPromises: Array<Promise<{ eTag: string; partNumber: number }>> = [];
  const partProgress = new Map<number, number>();

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const startByte = (partNumber - 1) * PART_SIZE;
    const endByte = Math.min(startByte + PART_SIZE, file.size);
    const blobPart = file.slice(startByte, endByte);

    const uploadChunk = async () => {
      const previousProgress = partProgress.get(partNumber) ?? 0;
      if (previousProgress > 0 && onProgress) {
        // Remove any bytes counted from a failed prior attempt for this part
        onProgress(-previousProgress);
      }

      let lastChunkLoaded = 0;
      partProgress.set(partNumber, 0);

      const partResp = await commonApiPost<
        ApiUploadPartOfMultipartUploadRequest,
        ApiUploadPartOfMultipartUploadResponse
      >({
        endpoint: endpoints.part,
        body: {
          upload_id,
          key,
          part_no: partNumber,
        },
      });

      const { upload_url } = partResp;
      if (!upload_url) {
        throw new Error("No upload_url returned for part " + partNumber);
      }

      const s3Resp = await axios.put(upload_url, blobPart, {
        headers: {
          "Content-Type": contentType,
        },
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

  const uploadedParts = await Promise.all(partPromises);

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
  });

  const { media_url } = completionData;
  if (!media_url) {
    throw new Error("No final media_url returned from completion endpoint");
  }

  return media_url;
}
