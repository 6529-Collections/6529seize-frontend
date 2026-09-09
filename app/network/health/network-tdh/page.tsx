import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import CommunityStatsComponent from "@/components/communityStats/CommunityStats";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { getAppMetadata } from "@/components/providers/metadata";

export default function CommunityStatsPage() {
  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/health/network-tdh"
          desktopFlush
          withDivider
        />

        <article className="tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <CommunityStatsComponent />
        </article>
      </div>
    </main>
  );
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: "Stats | Network",
    description: "Network",
  });
};
