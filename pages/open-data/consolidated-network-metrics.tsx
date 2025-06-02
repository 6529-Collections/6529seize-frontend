import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { VIEW } from "../../components/community-downloads/CommunityDownloadsTDH";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const CommunityDownloadsTDH = dynamic(
  () => import("../../components/community-downloads/CommunityDownloadsTDH"),
  {
    ssr: false,
  }
);

export default function ConsolidatedCommunityMetricsDownloads() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Consolidated Network Metrics | Open Data",
    });
  }, []);

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
