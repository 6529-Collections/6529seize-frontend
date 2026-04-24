import { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";

function normalizeMimeType(mimeType: string): string {
  if (!mimeType) return "";
  return (mimeType.split(";")[0] ?? "").trim().toLowerCase();
}

const API_MEDIA_UPLOAD_MIME_TYPES = new Set<string>(
  Object.values(ApiMediaUploadMimeType).map((value) => normalizeMimeType(value))
);

export const API_MEDIA_UPLOAD_MIME_TYPE_VALUES = Object.values(
  ApiMediaUploadMimeType
);

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
  if (fileName.endsWith(".glb") || fileName.endsWith(".gltf")) {
    return "model/gltf-binary";
  }
  if (fileName.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (fileName.endsWith(".mov")) {
    return "video/quicktime";
  }
  if (fileName.endsWith(".avi")) {
    return "video/x-msvideo";
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
  if (fileName.endsWith(".mp3")) {
    return "audio/mpeg";
  }
  if (fileName.endsWith(".wav")) {
    return "audio/wav";
  }
  if (fileName.endsWith(".aac")) {
    return "audio/aac";
  }
  if (fileName.endsWith(".ogg")) {
    return "audio/ogg";
  }
  if (fileName.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (fileName.endsWith(".csv")) {
    return "text/csv";
  }

  return "application/octet-stream";
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
