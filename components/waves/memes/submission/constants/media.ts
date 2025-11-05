// Supported MIME types when creators embed hosted interactive experiences.
export const ALLOWED_INTERACTIVE_MEDIA_MIME_TYPES = [
  { value: "text/html", label: "Interactive HTML" },
  { value: "image/png", label: "Image (PNG)" },
  { value: "image/jpeg", label: "Image (JPG)" },
  { value: "video/mp4", label: "Video (MP4)" },
  { value: "video/webm", label: "Video (WebM)" },
] as const;

export const DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE =
  ALLOWED_INTERACTIVE_MEDIA_MIME_TYPES[0].value;

export type InteractiveMediaMimeType =
  (typeof ALLOWED_INTERACTIVE_MEDIA_MIME_TYPES)[number]["value"];

export const ALLOWED_INTERACTIVE_MEDIA_MIME_TYPE_SET =
  new Set<InteractiveMediaMimeType>(
    ALLOWED_INTERACTIVE_MEDIA_MIME_TYPES.map((item) => item.value)
  );

export const isAllowedInteractiveMediaMimeType = (
  value: string
): value is InteractiveMediaMimeType =>
  ALLOWED_INTERACTIVE_MEDIA_MIME_TYPES.some((item) => item.value === value);

export const INTERACTIVE_MEDIA_PROVIDERS = [
  { key: "ipfs", label: "IPFS" },
  { key: "arweave", label: "Arweave" },
] as const;

export type InteractiveMediaProvider =
  (typeof INTERACTIVE_MEDIA_PROVIDERS)[number]["key"];
