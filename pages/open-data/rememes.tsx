import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const CommunityDownloadsRememes = dynamic(
  () => import("../../components/communityDownloads/CommunityDownloadsRememes"),
  {
    ssr: false,
  }
);

export default function RememesDownloads() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Rememes | Open Data",
    });
  }, []);

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
