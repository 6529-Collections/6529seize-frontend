import { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";

function normalizeMimeType(mimeType: string): string {
  if (!mimeType) return "";
  return (mimeType.split(";")[0]?.trim() ?? "").toLowerCase();
}

const API_MEDIA_UPLOAD_MIME_TYPES = new Set<string>(
  Object.values(ApiMediaUploadMimeType).map((value) => normalizeMimeType(value))
);

export const API_MEDIA_UPLOAD_MIME_TYPE_VALUES = Object.values(
  ApiMediaUploadMimeType
);

const FILE_TYPE_LABEL_RULES: ReadonlyArray<{
  readonly label: string;
  readonly matches: (mimeType: string) => boolean;
}> = [
  { label: "Image", matches: (m) => m.startsWith("image/") },
  { label: "Video", matches: (m) => m.startsWith("video/") },
  { label: "Audio", matches: (m) => m.startsWith("audio/") },
  { label: "3D Model", matches: (m) => m.startsWith("model/") },
  { label: "PDF", matches: (m) => m === ApiMediaUploadMimeType.ApplicationPdf },
  { label: "CSV", matches: (m) => m === ApiMediaUploadMimeType.TextCsv },
];

function getUploadMimeTypeLabel(mimeType: ApiMediaUploadMimeType): string {
  return (
    FILE_TYPE_LABEL_RULES.find((rule) => rule.matches(mimeType))?.label ??
    "File"
  );
}

export const ACCEPTED_FILE_TYPE_LABELS = Array.from(
  new Set(API_MEDIA_UPLOAD_MIME_TYPE_VALUES.map(getUploadMimeTypeLabel))
).join(", ");

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
  const lower = fileName.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot === -1 || dot === lower.length - 1) {
    return "application/octet-stream";
  }
  const extKey = lower.slice(dot);
  return EXTENSION_CONTENT_TYPES.get(extKey) ?? "application/octet-stream";
}

export function getContentType(file: File): string {
  const browserMimeType = normalizeMimeType(file.type);
  const fileNameLower = file.name.toLowerCase();

  if (
    browserMimeType === "application/vnd.ms-excel" &&
    fileNameLower.endsWith(".csv")
  ) {
    return "text/csv";
  }

  if (browserMimeType && API_MEDIA_UPLOAD_MIME_TYPES.has(browserMimeType)) {
    return browserMimeType;
  }

  const fromExtension = getContentTypeFromExtension(file.name);
  if (fromExtension !== "application/octet-stream") {
    return fromExtension;
  }

  return browserMimeType || "application/octet-stream";
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
