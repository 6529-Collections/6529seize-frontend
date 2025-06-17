import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../contexts/TitleContext";

const CommunityDownloadsRememes = dynamic(
  () =>
    import("../../components/community-downloads/CommunityDownloadsRememes"),
  {
    ssr: false,
  }
);

export default function RememesDownloads() {
  useSetTitle("Rememes | Open Data");

  return (
    <main className={styles.main}>
      <CommunityDownloadsRememes />
    </main>
  );
}

RememesDownloads.metadata = {
  title: "Rememes",
  description: "Open Data",
};
