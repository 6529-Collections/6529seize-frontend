import CommunityDownloadsTDH, {
  VIEW,
} from "@/components/community-downloads/CommunityDownloadsTDH";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import { Metadata } from "next";

export default function ConsolidatedCommunityMetricsDownloads() {
  return (
    <main className={styles.main}>
      <CommunityDownloadsTDH view={VIEW.CONSOLIDATION} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Network Metrics",
    description: "Open Data",
  });
}
