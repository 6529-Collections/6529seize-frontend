import {
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";

/**
 * The API refused an upload for a reason that trying again right away will
 * not change: the profile's rolling upload limit, or the media size limit.
 * The message is user-facing; callers show it and do not retry.
 */
export class MediaUploadRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadRefusedError";
  }
}

/**
 * Turns the API's upload-limit (429 `MEDIA_UPLOAD_BUDGET_EXCEEDED`) and
 * media-size (413 `MEDIA_TOO_LARGE`) answers into a MediaUploadRefusedError
 * with a localized message. Returns every other error unchanged.
 */
export function toMediaUploadRefusedError(
  error: unknown,
  locale: SupportedLocale
): unknown {
  const status = getStructuredApiErrorStatus(error);
  const code = getStructuredApiErrorCode(error);
  if (status === 429 && code === "MEDIA_UPLOAD_BUDGET_EXCEEDED") {
    return new MediaUploadRefusedError(t(locale, "drop.upload.limitReached"));
  }
  if (status === 413 && code === "MEDIA_TOO_LARGE") {
    return new MediaUploadRefusedError(t(locale, "drop.upload.tooLarge"));
  }
  return error;
}
