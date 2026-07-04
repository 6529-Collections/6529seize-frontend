import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import CommunityStatsComponent from "@/components/communityStats/CommunityStats";
import { NETWORK_REFERENCE_PAGE_CLASSES } from "@/components/network/networkPageLayoutClasses";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.css";

export default function CommunityStatsPage() {
  return (
    <main className={styles["main"]}>
      <section className={NETWORK_REFERENCE_PAGE_CLASSES}>
        <AboutContentsDropdown currentHref="/network/health/network-tdh" />
        <CommunityStatsComponent />
      </section>
    </main>
  );
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: "Stats",
    description: "Network",
  });
};
