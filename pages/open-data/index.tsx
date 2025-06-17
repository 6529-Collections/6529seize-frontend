import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../contexts/TitleContext";

const CommunityDownloads = dynamic(
  () => import("../../components/community-downloads/CommunityDownloads"),
  {
    ssr: false,
  }
);

export default function Downloads() {
  useSetTitle("Open Data");

  return (
    <main className={styles.main}>
      <CommunityDownloads />
    </main>
  );
}

Downloads.metadata = {
  title: "Open Data",
};
