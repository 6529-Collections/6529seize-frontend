import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function ModerationDeletedBadge() {
  const locale = useBrowserLocale();
  return (
    <span className="tw-text-red-100 tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold">
      {t(locale, "contentModeration.originalPost.deleted")}
    </span>
  );
}
