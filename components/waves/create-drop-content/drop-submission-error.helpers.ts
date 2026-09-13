import { getToastErrorDetails } from "@/helpers/toast.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getStructuredApiErrorCode } from "@/services/api/common-api";

export function getDropSubmissionErrorContent({
  error,
  isContentModerationRejection,
  isProfileSuspendedRejection,
  locale,
}: {
  readonly error: unknown;
  readonly isContentModerationRejection: boolean;
  readonly isProfileSuspendedRejection: boolean;
  readonly locale: SupportedLocale;
}): { readonly description: string; readonly details?: string | undefined } {
  if (getStructuredApiErrorCode(error) === "MODERATION_PERMIT_CONSUMED") {
    return { description: t(locale, "contentModeration.approvalConsumed") };
  }
  if (isContentModerationRejection) {
    return { description: t(locale, "contentModeration.postRejected") };
  }
  if (isProfileSuspendedRejection) {
    return {
      description: t(locale, "contentModeration.posting.suspended"),
    };
  }
  return {
    description: t(locale, "contentModeration.error.retry"),
    details: getToastErrorDetails(error),
  };
}
