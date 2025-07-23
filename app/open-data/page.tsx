import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import CommunityDownloads from "@/components/community-downloads/CommunityDownloads";
import { Metadata } from "next";

export default function Downloads() {
  return (
    <main className={styles.main}>
      <CommunityDownloads />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Open Data",
  });
}
