import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const CommunityDownloadsRoyalties = dynamic(
  () =>
    import("../../components/community-downloads/CommunityDownloadsRoyalties"),
  {
    ssr: false,
  }
);

export default function RoyaltiesDownloads() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Royalties | Open Data",
    });
  }, []);

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
