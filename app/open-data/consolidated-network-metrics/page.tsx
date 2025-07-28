import styles from "@/styles/Home.module.scss";
import CommunityDownloadsTDH, {
  VIEW,
} from "@/components/community-downloads/CommunityDownloadsTDH";
import { getAppMetadata } from "@/components/providers/metadata";
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
    title: "Consolidated Network Metrics",
    description: "Open Data",
  });
}
