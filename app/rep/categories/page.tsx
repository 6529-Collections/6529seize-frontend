import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { getAppMetadata } from "@/components/providers/metadata";
import RepCategoryExplorer from "@/components/rep/categories/RepCategoryExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = getAppMetadata({
  title: "REP Categories",
  description: "Search global REP categories and inspect category analytics.",
});

export default function RepCategoriesPage() {
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
          <RepCategoryExplorer />
        </article>
      </div>
    </main>
  );
}
