import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function MuseumPublicationUnavailable() {
  return (
    <div
      className="tw-max-w-3xl tw-border-l-2 tw-border-yellow-400 tw-pl-5"
      role="alert"
    >
      <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        {t(DEFAULT_LOCALE, "museum.network.publicationUnavailable.title")}
      </h1>
      <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-yellow-100">
        {t(DEFAULT_LOCALE, "museum.network.publicationUnavailable.description")}
      </p>
    </div>
  );
}
