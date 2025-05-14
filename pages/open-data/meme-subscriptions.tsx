import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const CommunityDownloadsSubscriptions = dynamic(
  () =>
    import(
      "../../components/communityDownloads/CommunityDownloadsSubscriptions"
    ),
  {
    ssr: false,
  }
);

export default function MemeSubscriptions() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Meme Subscriptions | Open Data",
    });
  }, []);

  return (
    <main className={styles.main}>
      <CommunityDownloadsSubscriptions />
    </main>
  );
}

MemeSubscriptions.metadata = {
  title: "Meme Subscriptions",
  description: "Open Data",
};
