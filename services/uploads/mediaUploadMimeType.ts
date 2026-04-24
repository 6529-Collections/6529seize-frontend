import { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";

const API_MEDIA_UPLOAD_MIME_TYPES = new Set<string>(
  Object.values(ApiMediaUploadMimeType)
);

export const API_MEDIA_UPLOAD_MIME_TYPE_VALUES = Object.values(
  ApiMediaUploadMimeType
);

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function getContentType(file: File): string {
  const browserMimeType = normalizeMimeType(file.type);
  if (browserMimeType) {
    return browserMimeType;
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

