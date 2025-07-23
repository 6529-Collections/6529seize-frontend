import styles from "@/styles/Home.module.scss";
import CommunityDownloadsTeam from "@/components/community-downloads/CommunityDownloadsTeam";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";

export default function TeamDownloads() {
  return (
    <main className={styles.main}>
      <CommunityDownloadsTeam />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Team",
    description: "Open Data",
  });
}
