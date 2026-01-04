import styles from "@/styles/Home.module.scss";
import CommunityDownloadsRoyalties from "@/components/community-downloads/CommunityDownloadsRoyalties";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function RoyaltiesDownloads() {
  return (
    <main className={styles["main"]}>
      <CommunityDownloadsRoyalties />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Royalties",
    description: "Open Data",
  });
}
