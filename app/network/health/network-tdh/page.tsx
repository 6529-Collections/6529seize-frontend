import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import CommunityStatsComponent from "@/components/communityStats/CommunityStats";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { getAppMetadata } from "@/components/providers/metadata";

export default function CommunityStatsPage() {
  return (
    <main
      className={`${NETWORK_REFERENCE_PAGE_CLASSES} tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900 tw-text-iron-100`}
    >
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/health/network-tdh"
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
