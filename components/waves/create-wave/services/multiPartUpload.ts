import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import {
  multipartUploadCore,
  getContentType,
} from "@/services/uploads/multipartUploadCore";

const MAX_FILE_SIZE = 500 * 1024 * 1024;

interface MultiPartUploadParams {
  file: File;
  path: "drop" | "wave";
  onProgress?: ((progressPercent: number) => void) | undefined;
}

export async function multiPartUpload({
  file,
  path,
  onProgress,
}: MultiPartUploadParams): Promise<ApiDropMedia> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum allowed size of 500 MB");
  }

  const contentType = getContentType(file);

  let overallUploaded = 0;

  const handleProgress = (bytesUploaded: number) => {
    overallUploaded += bytesUploaded;
    if (onProgress) {
      if (file.size === 0) {
        onProgress(100);
        return;
      }

      const percent = Math.floor((overallUploaded / file.size) * 100);
      onProgress(Math.min(Math.max(percent, 0), 100));
    }
  };

  const mediaUrl = await multipartUploadCore({
    file,
    endpoints: {
      start: `${path}-media/multipart-upload`,
      part: `${path}-media/multipart-upload/part`,
      complete: `${path}-media/multipart-upload/completion`,
    },
    onProgress: handleProgress,
  });

  return {
    url: mediaUrl,
    mime_type: contentType,
  };
}
