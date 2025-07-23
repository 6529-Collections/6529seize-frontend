import styles from "@/styles/Home.module.scss";
import { getAppMetadata } from "@/components/providers/metadata";
import CommunityMetricsClient from "./page.client";

export default function CommunityMetrics() {
  return (
    <main className={`${styles.main} ${styles.tdhMain}`}>
      <CommunityMetricsClient />
    </main>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Metrics",
    description: "Network",
  });
};
