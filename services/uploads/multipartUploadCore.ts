import axios from "axios";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { commonApiPost } from "@/services/api/common-api";
import { ApiCreateMediaUploadUrlRequest } from "@/generated/models/ApiCreateMediaUploadUrlRequest";
import { ApiStartMultipartMediaUploadResponse } from "@/generated/models/ApiStartMultipartMediaUploadResponse";
import { ApiUploadPartOfMultipartUploadRequest } from "@/generated/models/ApiUploadPartOfMultipartUploadRequest";
import { ApiUploadPartOfMultipartUploadResponse } from "@/generated/models/ApiUploadPartOfMultipartUploadResponse";
import { ApiCompleteMultipartUploadRequest } from "@/generated/models/ApiCompleteMultipartUploadRequest";
import { ApiCompleteMultipartUploadResponse } from "@/generated/models/ApiCompleteMultipartUploadResponse";

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

export function getContentType(file: File): string {
  if (file.type) {
    return file.type;
  }

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".glb")) {
    return "model/gltf-binary";
  }
  if (fileName.endsWith(".gltf")) {
    return "model/gltf+json";
  }
  if (fileName.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (fileName.endsWith(".mov")) {
    return "video/quicktime";
  }
  if (fileName.endsWith(".png")) {
    return "image/png";
  }
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (fileName.endsWith(".gif")) {
    return "image/gif";
  }
  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }

  return "application/octet-stream";
}

export async function multipartUploadCore({
  file,
  endpoints,
  onProgress,
}: MultipartUploadCoreParams): Promise<string> {
  const contentType = getContentType(file);

  const startData = await commonApiPost<
    ApiCreateMediaUploadUrlRequest,
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

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const startByte = (partNumber - 1) * PART_SIZE;
    const endByte = Math.min(startByte + PART_SIZE, file.size);
    const blobPart = file.slice(startByte, endByte);

    const uploadChunk = async () => {
      let lastChunkLoaded = 0;

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
          if (event.loaded && onProgress) {
            const chunkDelta = event.loaded - lastChunkLoaded;
            lastChunkLoaded = event.loaded;
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

