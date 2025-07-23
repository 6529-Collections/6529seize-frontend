import styles from "@/styles/Home.module.scss";
import CommunityDownloadsSubscriptions from "@/components/community-downloads/CommunityDownloadsSubscriptions";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";

export default function MemeSubscriptions() {
  return (
    <main className={styles.main}>
      <CommunityDownloadsSubscriptions />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Meme Subscriptions",
    description: "Open Data",
  });
}
