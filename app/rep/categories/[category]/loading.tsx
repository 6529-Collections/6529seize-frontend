import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function GlobalRepCategoryLoading() {
  const loadingLabel = t(DEFAULT_LOCALE, "rep.categories.loading.details");

  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/rep/categories"
          desktopFlush
          withDivider
        />
        <article className="tw-mx-auto tw-w-full tw-max-w-7xl tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <div
            aria-live="polite"
            aria-label={loadingLabel}
            className="tw-flex tw-w-full tw-flex-col tw-gap-4"
          >
            <span className="tw-sr-only">{loadingLabel}</span>
            <div
              aria-hidden="true"
              className="tw-h-5 tw-w-40 tw-animate-pulse tw-rounded tw-bg-white/10"
            />
            <div
              aria-hidden="true"
              className="tw-h-10 tw-w-80 tw-max-w-full tw-animate-pulse tw-rounded tw-bg-white/10"
            />
            <div
              aria-hidden="true"
              className="tw-h-64 tw-w-full tw-animate-pulse tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03]"
            />
          </div>
        </article>
      </div>
    </main>
  );
}
