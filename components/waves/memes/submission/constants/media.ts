export const ALLOWED_EXTERNAL_MEDIA_MIME_TYPES = [
  { value: "text/html", label: "Interactive HTML" },
  { value: "image/png", label: "Image (PNG)" },
  { value: "image/jpeg", label: "Image (JPG)" },
  { value: "video/mp4", label: "Video (MP4)" },
  { value: "video/webm", label: "Video (WebM)" },
] as const;

export const DEFAULT_EXTERNAL_MEDIA_MIME_TYPE =
  ALLOWED_EXTERNAL_MEDIA_MIME_TYPES[0].value;

export type ExternalMediaMimeType =
  (typeof ALLOWED_EXTERNAL_MEDIA_MIME_TYPES)[number]["value"];

export const ALLOWED_EXTERNAL_MEDIA_MIME_TYPE_SET =
  new Set<ExternalMediaMimeType>(
    ALLOWED_EXTERNAL_MEDIA_MIME_TYPES.map((item) => item.value)
  );

export const isAllowedExternalMediaMimeType = (
  value: string
): value is ExternalMediaMimeType =>
  ALLOWED_EXTERNAL_MEDIA_MIME_TYPES.some((item) => item.value === value);
