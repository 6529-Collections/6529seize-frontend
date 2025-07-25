import styles from "@/styles/Home.module.scss";
import CommunityDownloadsTDH, {
  VIEW,
} from "@/components/community-downloads/CommunityDownloadsTDH";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";

export default function CommunityMetricsDownloads() {
  return (
    <main className={styles.main}>
      <CommunityDownloadsTDH view={VIEW.WALLET} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Network Metrics",
    description: "Open Data",
  });
}
