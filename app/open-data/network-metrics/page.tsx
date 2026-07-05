import CommunityDownloadsTDH from "@/components/community-downloads/CommunityDownloadsTDH";
import { VIEW } from "@/components/community-downloads/views";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";

export default function ConsolidatedCommunityMetricsDownloads() {
  return (
    <main className={styles["main"]}>
      <CommunityDownloadsTDH view={VIEW.CONSOLIDATION} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Consolidated Network Metrics | Open Data",
    description: "Open Data",
  });
}
