import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const CommunityDownloadsTeam = dynamic(
  () => import("../../components/community-downloads/CommunityDownloadsTeam"),
  {
    ssr: false,
  }
);

export default function TeamDownloads() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Team | Open Data",
    });
  }, []);

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
