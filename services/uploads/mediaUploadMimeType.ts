import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatList } from "@/i18n/format";
import { ApiMediaUploadMimeType } from "@/generated/models/ApiMediaUploadMimeType";
import { ApiAttachmentUploadMimeType } from "@/generated/models/ApiAttachmentUploadMimeType";

const BROWSER_MIME_TYPE_ALIASES: Readonly<Record<string, string>> = {
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/x-pn-wav": "audio/wav",
  "audio/x-mp3": "audio/mp3",
  "audio/x-mpeg": "audio/mpeg",
  "video/avi": "video/x-msvideo",
  "video/msvideo": "video/x-msvideo",
};

function normalizeMimeType(mimeType: string): string {
  if (!mimeType) return "";
  const normalized = (mimeType.split(";")[0]?.trim() ?? "").toLowerCase();
  return BROWSER_MIME_TYPE_ALIASES[normalized] ?? normalized;
}

const API_MEDIA_UPLOAD_MIME_TYPES = new Set<string>(
  Object.values(ApiMediaUploadMimeType).map((value) => normalizeMimeType(value))
);

const API_MEDIA_UPLOAD_MIME_TYPE_VALUES = Object.values(ApiMediaUploadMimeType);

const FILE_TYPE_LABELS: Record<
  ApiMediaUploadMimeType | ApiAttachmentUploadMimeType,
  string
> = {
  "image/png": "PNG",
  "image/jpeg": "JPG/JPEG",
  "image/jpg": "JPG/JPEG",
  "image/gif": "GIF",
  "image/webp": "WebP",
  "image/avif": "AVIF",
  "video/mp4": "MP4",
  "video/quicktime": "MOV",
  "video/x-msvideo": "AVI",
  "audio/mpeg": "MP3",
  "audio/mpeg3": "MP3",
  "audio/mp3": "MP3",
  "audio/wav": "WAV",
  "audio/aac": "AAC",
  "audio/x-aac": "AAC",
  "audio/ogg": "OGG",
  "model/gltf-binary": "GLB",
  "application/pdf": "PDF",
  "text/csv": "CSV",
};

const ACCEPTED_FILE_TYPE_LABELS = Array.from(
  new Set(
    [
      ...API_MEDIA_UPLOAD_MIME_TYPE_VALUES,
      ...Object.values(ApiAttachmentUploadMimeType),
    ].map((mimeType) => FILE_TYPE_LABELS[mimeType])
  )
).join(", ");

export function getAcceptedUploadFormats(
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return t(locale, "drop.upload.acceptedFormats", {
    formats: ACCEPTED_FILE_TYPE_LABELS,
  });
}

export function getUnsupportedUploadToast(
  files: readonly File[],
  locale: SupportedLocale = DEFAULT_LOCALE
): AppToastInput {
  return {
    type: "error",
    title: t(locale, "drop.upload.unsupported", {
      files: formatList(
        locale,
        files.map((file) => file.name)
      ),
    }),
    description: getAcceptedUploadFormats(locale),
    autoClose: false,
  };
}

const EXTENSION_CONTENT_TYPES = new Map<
  string,
  ApiMediaUploadMimeType | ApiAttachmentUploadMimeType
>([
  [".glb", ApiMediaUploadMimeType.ModelGltfBinary],
  [".mp4", ApiMediaUploadMimeType.VideoMp4],
  [".mov", ApiMediaUploadMimeType.VideoQuicktime],
  [".avi", ApiMediaUploadMimeType.VideoXMsvideo],
  [".png", ApiMediaUploadMimeType.ImagePng],
  [".jpg", ApiMediaUploadMimeType.ImageJpg],
  [".jpeg", ApiMediaUploadMimeType.ImageJpeg],
  [".gif", ApiMediaUploadMimeType.ImageGif],
  [".webp", ApiMediaUploadMimeType.ImageWebp],
  [".avif", ApiMediaUploadMimeType.ImageAvif],
  [".qt", ApiMediaUploadMimeType.VideoQuicktime],
  [".mpeg", ApiMediaUploadMimeType.AudioMpeg],
  [".mp3", ApiMediaUploadMimeType.AudioMpeg],
  [".wav", ApiMediaUploadMimeType.AudioWav],
  [".aac", ApiMediaUploadMimeType.AudioAac],
  [".ogg", ApiMediaUploadMimeType.AudioOgg],
  [".pdf", ApiAttachmentUploadMimeType.ApplicationPdf],
  [".csv", ApiAttachmentUploadMimeType.TextCsv],
]);

export const DROP_UPLOAD_ACCEPT = [
  ...API_MEDIA_UPLOAD_MIME_TYPE_VALUES,
  ...Object.values(ApiAttachmentUploadMimeType),
  ...EXTENSION_CONTENT_TYPES.keys(),
].join(",");

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
  const contentType = getContentType(file);
  const extensionType = getContentTypeFromExtension(file.name);
  const browserType = normalizeMimeType(file.type);
  const isGenericBrowserType =
    !browserType ||
    [
      "application/octet-stream",
      "binary/octet-stream",
      "application/unknown",
    ].includes(browserType);
  if (
    !isGenericBrowserType &&
    /^(image|video|audio)\//.test(browserType) &&
    !API_MEDIA_UPLOAD_MIME_TYPES.has(browserType)
  )
    return false;
  const supportedTypes = FILE_TYPE_LABELS as Readonly<
    Record<string, string | undefined>
  >;
  return (
    supportedTypes[contentType] !== undefined &&
    supportedTypes[contentType] === supportedTypes[extensionType]
  );
}
