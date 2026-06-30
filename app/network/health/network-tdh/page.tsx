import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import CommunityStatsComponent from "@/components/communityStats/CommunityStats";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";

export default function CommunityStatsPage() {
  return (
    <main className={styles["main"]}>
      <section className="tailwind-scope">
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
