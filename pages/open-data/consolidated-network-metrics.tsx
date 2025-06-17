import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { VIEW } from "../../components/community-downloads/CommunityDownloadsTDH";
import { useSetTitle } from "../../contexts/TitleContext";

const CommunityDownloadsTDH = dynamic(
  () => import("../../components/community-downloads/CommunityDownloadsTDH"),
  {
    ssr: false,
  }
);

export default function ConsolidatedCommunityMetricsDownloads() {
  useSetTitle("Consolidated Network Metrics | Open Data");

  return (
    <main className={styles.main}>
      <CommunityDownloadsTDH view={VIEW.CONSOLIDATION} />
    </main>
  );
}

ConsolidatedCommunityMetricsDownloads.metadata = {
  title: "Consolidated Network Metrics",
  description: "Open Data",
};
