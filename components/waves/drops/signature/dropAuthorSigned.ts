import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";

type AuthorSignableDrop = Pick<ApiDrop, "id" | "is_author_signed">;

/** Positive-only: unsigned drops get no marker at all. */
export const isDropAuthorSigned = (drop: AuthorSignableDrop): boolean =>
  isSignedMessagesEnabled() &&
  drop.is_author_signed === true &&
  !drop.id.startsWith("temp-");

/**
 * The name of a control that is the whole drop card (so the seal inside it
 * is static), with "signed by its author" joined when the drop is.
 */
export const withAuthorSignedLabel = (
  locale: SupportedLocale,
  label: string,
  drop: AuthorSignableDrop
): string =>
  isDropAuthorSigned(drop)
    ? t(locale, "signedMessages.marker.withLabel", { label })
    : label;
