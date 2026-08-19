import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import XtdhPage from "@/components/xtdh/XtdhPage";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "xTDH Allocations",
    description:
      "Explore xTDH allocations across the entire ecosystem, discover active grantors, and manage your own grants.",
  });
}

export default function Page(): ReactElement {
  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/xtdh"
          desktopFlush
          withDivider
        />
        <article className="tw-mx-auto tw-w-full tw-max-w-6xl tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <XtdhPage />
        </article>
      </div>
    </main>
  );
}
