import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function OnchainUnavailable() {
  return (
    <section
      role="alert"
      className="tw-max-w-3xl tw-rounded-2xl tw-border tw-border-solid tw-border-yellow-400/30 tw-bg-yellow-400/10 tw-p-6"
    >
      <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        {t(DEFAULT_LOCALE, "museum.onchain.unavailable.heading")}
      </h1>
      <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-200">
        {t(DEFAULT_LOCALE, "museum.onchain.unavailable.body")}
      </p>
    </section>
  );
}
