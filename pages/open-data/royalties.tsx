import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../contexts/TitleContext";

const CommunityDownloadsRoyalties = dynamic(
  () =>
    import("../../components/community-downloads/CommunityDownloadsRoyalties"),
  {
    ssr: false,
  }
);

export default function RoyaltiesDownloads() {
  useSetTitle("Royalties | Open Data");

  return (
    <main className={styles.main}>
      <CommunityDownloadsRoyalties />
    </main>
  );
}

RoyaltiesDownloads.metadata = {
  title: "Royalties",
  description: "Open Data",
};
