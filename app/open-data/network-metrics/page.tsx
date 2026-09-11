import CommunityDownloadsTDH from "@/components/community-downloads/CommunityDownloadsTDH";
import { VIEW } from "@/components/community-downloads/views";
import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.css";
import clsx from "clsx";
import type { Metadata } from "next";

export default function ConsolidatedCommunityMetricsDownloads() {
  return (
    <main
      className={clsx(
        styles["main"],
        "tailwind-scope",
        ABOUT_PAGE_SURFACE_CLASS_NAME
      )}
    >
      <CommunityDownloadsTDH view={VIEW.CONSOLIDATION} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Consolidated Network Metrics | Open Data",
    description: "Open Data",
  });
}
