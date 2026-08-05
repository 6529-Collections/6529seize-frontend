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
    <main className="tailwind-scope tw-min-h-screen tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800 tw-bg-[#050506] tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-px-8">
      <div className="tw-mx-auto tw-w-full tw-max-w-7xl">
        <GlobalRepCategoryDetail
          category={category}
          mode="page"
          showSearchLink
        />
      </div>
    </main>
  );
}
