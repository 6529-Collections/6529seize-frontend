import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../contexts/TitleContext";

const CommunityDownloadsSubscriptions = dynamic(
  () =>
    import(
      "../../components/community-downloads/CommunityDownloadsSubscriptions"
    ),
  {
    ssr: false,
  }
);

export default function MemeSubscriptions() {
  useSetTitle("Meme Subscriptions | Open Data");

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
