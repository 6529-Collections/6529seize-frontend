import CommunityDownloads from "@/components/community-downloads/CommunityDownloads";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";

export default function Downloads() {
  return (
    <main className={styles["main"]}>
      <CommunityDownloads />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    {
      title: "Open Data",
      description: t(DEFAULT_LOCALE, "openData.metadata.description"),
    },
    { canonicalPath: "/open-data" }
  );
}
