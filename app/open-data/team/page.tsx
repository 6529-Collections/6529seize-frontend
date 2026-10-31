import styles from "@/styles/Home.module.css";
import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";
import CommunityDownloadsTeam from "@/components/community-downloads/CommunityDownloadsTeam";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import type { Metadata } from "next";

export default function TeamDownloads() {
  return (
    <main
      className={clsx(
        styles["main"],
        "tailwind-scope",
        ABOUT_PAGE_SURFACE_CLASS_NAME
      )}
    >
      <CommunityDownloadsTeam />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Team | Open Data",
    description: t(DEFAULT_LOCALE, "pageMetadata.openDataTeam.description"),
  });
}
