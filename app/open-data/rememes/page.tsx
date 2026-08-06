import styles from "@/styles/Home.module.css";
import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";
import CommunityDownloadsRememes from "@/components/community-downloads/CommunityDownloadsRememes";
import { getAppMetadata } from "@/components/providers/metadata";
import clsx from "clsx";
import type { Metadata } from "next";

export default function RememesDownloads() {
  return (
    <main
      className={clsx(
        styles["main"],
        "tailwind-scope",
        ABOUT_PAGE_SURFACE_CLASS_NAME
      )}
    >
      <CommunityDownloadsRememes />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Rememes | Open Data",
    description: "Open Data",
  });
}
