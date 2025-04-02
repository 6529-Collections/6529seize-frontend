// multiPartUpload.ts

import axios from "axios";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { commonApiPost } from "../../../../services/api/common-api";

// Adjust as needed:
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

/**
 * Multi-part upload for either "drop-media" or "wave-media".
 *
 * @param file - The File to upload
 * @param path - "drop-media" or "wave-media"
 * @returns An object { url, mime_type }
 */
export async function multiPartUpload(
  file: File,
  path: "drop-media" | "wave-media"
): Promise<{ url: string; mime_type: string }> {
  // -----------------------------------------------------
  // 1) Start the multi-part upload on your backend
  //    e.g. POST /api/<path>/multipart-upload
  // -----------------------------------------------------
  const startData = await commonApiPost<
    { file_name: string; content_type: string },
    StartMultipartResponse
  >({
    endpoint: `${path}/multipart-upload`,
    body: {
      file_name: file.name,
      content_type: file.type,
    },
  });

  const { upload_id, key } = startData;
  if (!upload_id || !key) {
    throw new Error("Server did not return required upload_id or key");
  }

  // -----------------------------------------------------
  // 2) Split the file into chunks, limit concurrency
  // -----------------------------------------------------
  const totalParts = Math.ceil(file.size / PART_SIZE);
  const limit = pLimit(CONCURRENCY);

  const partPromises: Array<Promise<{ eTag: string; partNumber: number }>> = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const startByte = (partNumber - 1) * PART_SIZE;
    const endByte = Math.min(startByte + PART_SIZE, file.size);
    const blobPart = file.slice(startByte, endByte);

    // The upload logic for a single chunk
    const uploadChunk = async () => {
      // 2.1) Request a pre-signed URL for *this* part
      const partResp = await commonApiPost<
        { upload_id: string; key: string; part_no: number },
        PartSignedUrlResponse
      >({
        endpoint: `${path}/multipart-upload/part`,
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

      // 2.2) PUT the chunk to S3 (with axios)
      //      If you want to set specific headers, do so here
      const s3Resp = await axios.put(upload_url, blobPart, {
        headers: {
          "Content-Type": file.type,
        },
        // Additional axios options if needed (e.g., onUploadProgress)
      });

      // 2.3) Grab the ETag from response headers
      //      Some S3 clients return ETag with quotes, so we strip them
      const eTagHeader = s3Resp.headers.etag;
      const eTag = eTagHeader ? eTagHeader.replace(/"/g, "") : "";

      return { eTag, partNumber };
    };

    // Wrap chunk upload in concurrency-limited + p-retry
    const chunkPromise = limit(() =>
      pRetry(uploadChunk, {
        retries: RETRIES,
        factor: 2,
        minTimeout: MIN_TIMEOUT,
      })
    );

    partPromises.push(chunkPromise);
  }

  // -----------------------------------------------------
  // 3) Wait for all part uploads to finish
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
    endpoint: `${path}/multipart-upload/completion`,
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
  // 5) Return final object
  // -----------------------------------------------------
  return {
    url: media_url,
    mime_type: file.type,
  };
}
