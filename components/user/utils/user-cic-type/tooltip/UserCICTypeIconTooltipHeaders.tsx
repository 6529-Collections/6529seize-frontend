import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function UserCICTypeIconTooltipHeaders({
  locale = DEFAULT_LOCALE,
}: {
  readonly locale?: SupportedLocale;
}) {
  return (
    <>
      <p className="tw-mb-0 tw-mt-0 tw-text-sm tw-font-semibold tw-text-white">
        {t(locale, "user.cicType.title")}
      </p>
      <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-normal tw-text-iron-400">
        {t(locale, "user.cicType.description")}
      </p>
    </>
  );
}
