import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../contexts/TitleContext";

const CommunityDownloadsTeam = dynamic(
  () => import("../../components/community-downloads/CommunityDownloadsTeam"),
  {
    ssr: false,
  }
);

export default function TeamDownloads() {
  useSetTitle("Team | Open Data");

  return (
    <main className={styles.main}>
      <CommunityDownloadsTeam />
    </main>
  );
}

TeamDownloads.metadata = {
  title: "Team",
  description: "Open Data",
};
