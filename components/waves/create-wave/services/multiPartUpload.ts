import axios from "axios";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { commonApiPost } from "../../../../services/api/common-api";
import { ApiDropMedia } from "../../../../generated/models/ApiDropMedia";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const PART_SIZE = 5 * 1024 * 1024; // 5 MB per chunk
const CONCURRENCY = 5; // how many parts to upload in parallel
const RETRIES = 3; // retry each chunk up to 3 times
const MIN_TIMEOUT = 1000; // 1 second minimum retry delay (p-retry)

interface StartMultipartResponse {
  upload_id: string;
  key: string;
}

interface PartSignedUrlResponse {
  upload_url: string;
  part_no: number;
}

interface CompleteMultipartResponse {
  media_url: string;
}

interface MultiPartUploadParams {
  /**
   * The file to upload
   */
  file: File;

  /**
   * "drop" or "wave"; used to build endpoints
   */
  path: "drop" | "wave";

  /**
   * Optional callback that receives an integer (0..100) representing % of file uploaded.
   */
  onProgress?: (progressPercent: number) => void;
}

/**
 * Multi-part upload for either "drop" or "wave" endpoints.
 * Uses concurrency, retries, and onUploadProgress for an overall progress callback.
 */
export async function multiPartUpload({
  file,
  path,
  onProgress,
}: MultiPartUploadParams): Promise<ApiDropMedia> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum allowed size of 500 MB");
  }

  // -----------------------------------------------------
  // 1) Start the multi-part upload on your backend
  //    e.g. POST /api/<path>-media/multipart-upload
  // -----------------------------------------------------
  // Determine content type, with fallback for GLB files
  const getContentType = (file: File): string => {
    if (file.type) {
      return file.type;
    }
    
    // Fallback MIME type detection for files without type
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.glb')) {
      return 'model/gltf-binary';
    }
    if (fileName.endsWith('.gltf')) {
      return 'model/gltf+json';
    }
    if (fileName.endsWith('.mp4')) {
      return 'video/mp4';
    }
    if (fileName.endsWith('.png')) {
      return 'image/png';
    }
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (fileName.endsWith('.gif')) {
      return 'image/gif';
    }
    
    // Default fallback
    return 'application/octet-stream';
  };

  const contentType = getContentType(file);
  console.log('File upload - detected content type:', contentType, 'for file:', file.name);

  const startData = await commonApiPost<
    { file_name: string; content_type: string },
    StartMultipartResponse
  >({
    endpoint: `${path}-media/multipart-upload`,
    body: {
      file_name: file.name,
      content_type: contentType,
    },
  });

  const { upload_id, key } = startData;
  if (!upload_id || !key) {
    throw new Error("Server did not return required upload_id or key");
  }

  // -----------------------------------------------------
  // 2) Break the file into chunks, set up concurrency
  // -----------------------------------------------------
  const totalParts = Math.ceil(file.size / PART_SIZE);
  const limit = pLimit(CONCURRENCY);

  // We'll accumulate the total # of bytes uploaded across all chunks
  let overallUploaded = 0;

  // We'll store promises for each chunk
  const partPromises: Array<Promise<{ eTag: string; partNumber: number }>> = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const startByte = (partNumber - 1) * PART_SIZE;
    const endByte = Math.min(startByte + PART_SIZE, file.size);
    const blobPart = file.slice(startByte, endByte);

    // This variable tracks how many bytes we've uploaded so far *for this chunk*
    // so we can calculate deltas in onUploadProgress.
    let lastChunkLoaded = 0;

    // The logic to upload one chunk
    const uploadChunk = async () => {
      // 2.1) Request a presigned URL for *this* part
      const partResp = await commonApiPost<
        { upload_id: string; key: string; part_no: number },
        PartSignedUrlResponse
      >({
        endpoint: `${path}-media/multipart-upload/part`,
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

      // 2.2) PUT the chunk to S3 (with axios + onUploadProgress)
      const s3Resp = await axios.put(upload_url, blobPart, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (event) => {
          // This can fire multiple times as the chunk uploads
          // event.loaded = bytes sent so far
          // event.total = total chunk bytes
          if (event.loaded) {
            const chunkDelta = event.loaded - lastChunkLoaded; // how many new bytes since last time
            lastChunkLoaded = event.loaded;
            // Add to overall
            overallUploaded += chunkDelta;

            // Calculate percentage (0..100)
            if (onProgress) {
              const percent = Math.floor((overallUploaded / file.size) * 100);
              onProgress(percent);
            }
          }
        },
      });

      // 2.3) Extract ETag
      const eTagHeader = s3Resp.headers.etag;
      const eTag = eTagHeader ? eTagHeader.replaceAll("\"", "") : "";
      if (!eTag) {
        throw new Error(`No ETag returned for part ${partNumber}`);
      }

      return { eTag, partNumber };
    };

    // Wrap chunk upload in concurrency-limit + retry
    const chunkPromise = limit(() =>
      pRetry(uploadChunk, {
        retries: RETRIES,
        factor: 2, // exponential backoff
        minTimeout: MIN_TIMEOUT,
      })
    );
    partPromises.push(chunkPromise);
  }

  // -----------------------------------------------------
  // 3) Wait for all parts to finish
  // -----------------------------------------------------
  const uploadedParts = await Promise.all(partPromises);

  // -----------------------------------------------------
  // 4) Complete the multi-part upload
  // -----------------------------------------------------
  const completionData = await commonApiPost<
    {
      upload_id: string;
      key: string;
      parts: Array<{ etag: string; part_no: number }>;
    },
    CompleteMultipartResponse
  >({
    endpoint: `${path}-media/multipart-upload/completion`,
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

  // -----------------------------------------------------
  // 5) Return the final object
  // -----------------------------------------------------
  return {
    url: media_url,
    mime_type: contentType,
  };
}
