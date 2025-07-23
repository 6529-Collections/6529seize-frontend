import styles from "@/styles/Home.module.scss";
import CommunityDownloadsRememes from "@/components/community-downloads/CommunityDownloadsRememes";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";

export default function RememesDownloads() {
  return (
    <main className={styles.main}>
      <CommunityDownloadsRememes />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Rememes",
    description: "Open Data",
  });
}
