import { getAppMetadata } from "@/components/providers/metadata";
import RepCategoryExplorer from "@/components/rep/categories/RepCategoryExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = getAppMetadata({
  title: "REP Categories",
  description: "Search global REP categories and inspect category analytics.",
});

export default function RepCategoriesPage() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-[#050506] tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-px-8">
      <div className="tw-mx-auto tw-w-full tw-max-w-7xl">
        <RepCategoryExplorer />
      </div>
    </main>
  );
}
