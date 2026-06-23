import type { ApiCreateMediaUrlResponse } from "@/generated/models/ApiCreateMediaUrlResponse";
import type { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";
import type { DistributionPhotoCompleteRequest } from "@/generated/models/DistributionPhotoCompleteRequest";
import type { DistributionPhotoCompleteResponse } from "@/generated/models/DistributionPhotoCompleteResponse";
import { commonApiPost } from "@/services/api/common-api";
import {
  getApiMediaUploadMimeType,
  multipartUploadCore,
} from "@/services/uploads/multipartUploadCore";
import axios from "axios";

const SIMPLE_UPLOAD_THRESHOLD = 5 * 1024 * 1024;

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

interface MediaUploadUrlRequest {
  content_type: ApiMediaUploadMimeType;
  file_name: string;
}

async function uploadSingleFile({
  contract,
  tokenId,
  file,
  onProgress,
}: SingleFileUploadParams): Promise<string> {
  const endpoint = `distribution_photos/${contract}/${tokenId}/prep`;
  const contentType = getApiMediaUploadMimeType(file);

  const prepData = await commonApiPost<
    MediaUploadUrlRequest,
    ApiCreateMediaUrlResponse
  >({
    endpoint,
    body: {
      content_type: contentType,
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
      "Content-Type": contentType,
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
  const baseEndpoint = `distribution_photos/${contract}/${tokenId}`;

  const completion = await multipartUploadCore({
    file,
    endpoints: {
      start: `${baseEndpoint}/multipart-upload`,
      part: `${baseEndpoint}/multipart-upload/part`,
      complete: `${baseEndpoint}/multipart-upload/completion`,
    },
    ...(onProgress && { onProgress }),
  });

  return completion.media_url;
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
      if (totalSize === 0) {
        onProgress(100);
        return;
      }
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
