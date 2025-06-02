import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const CommunityDownloads = dynamic(
  () => import("../../components/community-downloads/CommunityDownloads"),
  {
    ssr: false,
  }
);

export default function Downloads() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Open Data",
    });
  }, []);

  return (
    <main className={styles.main}>
      <CommunityDownloads />
    </main>
  );
}

Downloads.metadata = {
  title: "Open Data",
};
