import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { getAppMetadata } from "@/components/providers/metadata";
import GlobalRepCategoryDetail from "@/components/rep/categories/GlobalRepCategoryDetail";
import { decodeRepCategoryParam } from "@/components/rep/categories/globalRepCategory.helpers";
import type { Metadata } from "next";

type Props = {
  readonly params: Promise<{ readonly category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const category = decodeRepCategoryParam(rawCategory);

  return getAppMetadata({
    title: `${category} REP`,
    description: `Global REP category detail for ${category}`,
  });
}

export default async function GlobalRepCategoryPage({ params }: Props) {
  const { category: rawCategory } = await params;
  const category = decodeRepCategoryParam(rawCategory);

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
          <GlobalRepCategoryDetail
            category={category}
            mode="page"
            showSearchLink
          />
        </article>
      </div>
    </main>
  );
}
