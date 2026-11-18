import {
  getStructuredApiErrorBody,
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { formatFileSizeLabel } from "@/lib/link-preview/filePreviewI18n";

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

function getTooLargeMessage(
  maxBytes: unknown,
  locale: SupportedLocale
): string {
  const limit =
    typeof maxBytes === "number" && Number.isFinite(maxBytes) && maxBytes > 0
      ? formatFileSizeLabel(maxBytes, locale)
      : null;
  return limit
    ? t(locale, "drop.upload.tooLargeLimit", { limit })
    : t(locale, "drop.upload.tooLargeNoLimit");
}

/**
 * The error an upload start or completion request rejects with:
 * - the API's upload-limit (429 `MEDIA_UPLOAD_BUDGET_EXCEEDED`) and
 *   media-size (413 `MEDIA_TOO_LARGE`) answers become a
 *   MediaUploadRefusedError with a localized message;
 * - an API error whose body is not a JSON object (an HTML error page, an
 *   empty body) keeps its status but gets the generic upload message
 *   instead of that body;
 * - every other error is returned unchanged.
 */
export function toUploadRequestError(
  error: unknown,
  locale: SupportedLocale
): unknown {
  const status = getStructuredApiErrorStatus(error);
  if (status === undefined) {
    return error;
  }
  const body = getStructuredApiErrorBody(error);
  const code = getStructuredApiErrorCode(error);
  if (status === 429 && code === "MEDIA_UPLOAD_BUDGET_EXCEEDED") {
    return new MediaUploadRefusedError(t(locale, "drop.upload.limitReached"));
  }
  if (status === 413 && code === "MEDIA_TOO_LARGE") {
    return new MediaUploadRefusedError(
      getTooLargeMessage(body?.["max_bytes"], locale)
    );
  }
  if (!body && error instanceof Error) {
    error.message = t(locale, "drop.upload.uploadFailed");
  }
  return error;
}

/**
 * The text a caller shows for a failed upload: the message of an upload
 * refusal or of a local check, and `fallback` for any other API failure, so
 * a server response is never shown as it is.
 */
export function getUploadFailureMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error &&
    getStructuredApiErrorStatus(error) === undefined
    ? error.message
    : fallback;
}
