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

export default function CommunityMetricsDownloads() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Network Metrics | Open Data",
    });
  }, []);

  return (
    <main className={styles.main}>
      <CommunityDownloadsTDH view={VIEW.WALLET} />
    </main>
  );
}

CommunityMetricsDownloads.metadata = {
  title: "Network Metrics",
  description: "Open Data",
};
