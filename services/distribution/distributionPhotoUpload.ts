import axios from "axios";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { commonApiPost } from "@/services/api/common-api";
import { ApiCreateMediaUploadUrlRequest } from "@/generated/models/ApiCreateMediaUploadUrlRequest";
import { ApiCreateMediaUrlResponse } from "@/generated/models/ApiCreateMediaUrlResponse";
import { ApiStartMultipartMediaUploadResponse } from "@/generated/models/ApiStartMultipartMediaUploadResponse";
import { ApiUploadPartOfMultipartUploadRequest } from "@/generated/models/ApiUploadPartOfMultipartUploadRequest";
import { ApiUploadPartOfMultipartUploadResponse } from "@/generated/models/ApiUploadPartOfMultipartUploadResponse";
import { ApiCompleteMultipartUploadRequest } from "@/generated/models/ApiCompleteMultipartUploadRequest";
import { ApiCompleteMultipartUploadResponse } from "@/generated/models/ApiCompleteMultipartUploadResponse";
import { DistributionPhotoCompleteRequest } from "@/generated/models/DistributionPhotoCompleteRequest";
import { DistributionPhotoCompleteResponse } from "@/generated/models/DistributionPhotoCompleteResponse";

const SIMPLE_UPLOAD_THRESHOLD = 5 * 1024 * 1024;
const PART_SIZE = 5 * 1024 * 1024;
const CONCURRENCY = 5;
const RETRIES = 3;
const MIN_TIMEOUT = 1000;

interface DistributionPhotoUploadParams {
  contract: string;
  tokenId: string;
  files: File[];
  onProgress?: (progressPercent: number) => void;
}

interface SingleFileUploadParams {
  contract: string;
  tokenId: string;
  file: File;
  onProgress?: (bytesUploaded: number) => void;
}

async function uploadSingleFile({
  contract,
  tokenId,
  file,
  onProgress,
}: SingleFileUploadParams): Promise<string> {
  const endpoint = `distribution_photos/${contract}/${tokenId}/prep`;

  const prepData = await commonApiPost<
    ApiCreateMediaUploadUrlRequest,
    ApiCreateMediaUrlResponse
  >({
    endpoint,
    body: {
      content_type: file.type,
      file_name: file.name,
    },
  });

  const { upload_url, media_url } = prepData;
  if (!upload_url || !media_url) {
    throw new Error("Server did not return required upload_url or media_url");
  }

  let lastLoaded = 0;
  await axios.put(upload_url, file, {
    headers: {
      "Content-Type": file.type,
    },
    onUploadProgress: (event) => {
      if (event.loaded && onProgress) {
        const delta = event.loaded - lastLoaded;
        lastLoaded = event.loaded;
        onProgress(delta);
      }
    },
  });

  return media_url;
}

async function uploadLargeFile({
  contract,
  tokenId,
  file,
  onProgress,
}: SingleFileUploadParams): Promise<string> {
  const startEndpoint = `distribution_photos/${contract}/${tokenId}/multipart-upload`;
  const startData = await commonApiPost<
    ApiCreateMediaUploadUrlRequest,
    ApiStartMultipartMediaUploadResponse
  >({
    endpoint: startEndpoint,
    body: {
      content_type: file.type,
      file_name: file.name,
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

    let lastChunkLoaded = 0;

    const uploadChunk = async () => {
      const partResp = await commonApiPost<
        ApiUploadPartOfMultipartUploadRequest,
        ApiUploadPartOfMultipartUploadResponse
      >({
        endpoint: `distribution_photos/${contract}/${tokenId}/multipart-upload/part`,
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
          "Content-Type": file.type,
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
    endpoint: `distribution_photos/${contract}/${tokenId}/multipart-upload/completion`,
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

export async function uploadDistributionPhotos({
  contract,
  tokenId,
  files,
  onProgress,
}: DistributionPhotoUploadParams): Promise<string[]> {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  let overallUploaded = 0;

  const handleProgress = (bytesUploaded: number) => {
    overallUploaded += bytesUploaded;
    if (onProgress) {
      const percent = Math.floor((overallUploaded / totalSize) * 100);
      onProgress(Math.min(percent, 100));
    }
  };

  const mediaUrls: string[] = [];

  for (const file of files) {
    const uploadFn =
      file.size >= SIMPLE_UPLOAD_THRESHOLD ? uploadLargeFile : uploadSingleFile;

    const mediaUrl = await uploadFn({
      contract,
      tokenId,
      file,
      onProgress: handleProgress,
    });

    mediaUrls.push(mediaUrl);
  }

  await commonApiPost<
    DistributionPhotoCompleteRequest,
    DistributionPhotoCompleteResponse
  >({
    endpoint: `distribution_photos/${contract}/${tokenId}/complete`,
    body: {
      photos: mediaUrls.map((url) => ({ media_url: url })),
    },
  });

  return mediaUrls;
}
