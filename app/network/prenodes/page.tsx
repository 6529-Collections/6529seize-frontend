import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import PrenodesStatus from "@/components/prenodes/PrenodesStatus";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { getAppMetadata } from "@/components/providers/metadata";

export default function PrenodesPage() {
  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/prenodes"
          desktopFlush
          withDivider
        />
        <article className="tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <PrenodesStatus />
        </article>
      </div>
    </main>
  );
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: t(DEFAULT_LOCALE, "network.prenodes.pageTitle"),
    description: t(DEFAULT_LOCALE, "network.prenodes.deprecation"),
  });
};
