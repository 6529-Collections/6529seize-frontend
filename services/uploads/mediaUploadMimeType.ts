import { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";

function normalizeMimeType(mimeType: string): string {
  if (!mimeType) return "";
  return mimeType.split(";")[0].trim().toLowerCase();
}

const API_MEDIA_UPLOAD_MIME_TYPES = new Set<string>(
  Object.values(ApiMediaUploadMimeType).map((value) => normalizeMimeType(value))
);

export const API_MEDIA_UPLOAD_MIME_TYPE_VALUES = Object.values(
  ApiMediaUploadMimeType
);

const EXTENSION_CONTENT_TYPES = new Map<string, ApiMediaUploadMimeType>([
  [".glb", ApiMediaUploadMimeType.ModelGltfBinary],
  [".gltf", ApiMediaUploadMimeType.ModelGltfBinary],
  [".mp4", ApiMediaUploadMimeType.VideoMp4],
  [".mov", ApiMediaUploadMimeType.VideoQuicktime],
  [".avi", ApiMediaUploadMimeType.VideoXMsvideo],
  [".png", ApiMediaUploadMimeType.ImagePng],
  [".jpg", ApiMediaUploadMimeType.ImageJpg],
  [".jpeg", ApiMediaUploadMimeType.ImageJpeg],
  [".gif", ApiMediaUploadMimeType.ImageGif],
  [".webp", ApiMediaUploadMimeType.ImageWebp],
  [".mp3", ApiMediaUploadMimeType.AudioMpeg],
  [".wav", ApiMediaUploadMimeType.AudioWav],
  [".aac", ApiMediaUploadMimeType.AudioAac],
  [".ogg", ApiMediaUploadMimeType.AudioOgg],
  [".pdf", ApiMediaUploadMimeType.ApplicationPdf],
  [".csv", ApiMediaUploadMimeType.TextCsv],
]);

function getContentTypeFromExtension(fileName: string): string {
  const match = Array.from(EXTENSION_CONTENT_TYPES).find(([extension]) =>
    fileName.endsWith(extension)
  );
  return match?.[1] ?? "application/octet-stream";
}

export function getContentType(file: File): string {
  const browserMimeType = normalizeMimeType(file.type);
  const fileName = file.name.toLowerCase();

  // Browsers sometimes mis-report .csv files as the legacy Excel MIME type.
  // The backend does not accept application/vnd.ms-excel, so coerce these
  // back to text/csv when the filename extension makes the intent clear.
  if (
    browserMimeType === "application/vnd.ms-excel" &&
    fileName.endsWith(".csv")
  ) {
    return "text/csv";
  }

  if (browserMimeType) {
    return browserMimeType;
  }

  return getContentTypeFromExtension(fileName);
}

export function toApiMediaUploadMimeType(
  mimeType: string
): ApiMediaUploadMimeType | null {
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (!API_MEDIA_UPLOAD_MIME_TYPES.has(normalizedMimeType)) {
    return null;
  }

  return normalizedMimeType as ApiMediaUploadMimeType;
}

export function isSupportedUploadFile(file: File): boolean {
  return toApiMediaUploadMimeType(getContentType(file)) !== null;
}
