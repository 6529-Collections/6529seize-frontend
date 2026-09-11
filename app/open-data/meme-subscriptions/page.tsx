import styles from "@/styles/Home.module.css";
import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";
import CommunityDownloadsSubscriptions from "@/components/community-downloads/CommunityDownloadsSubscriptions";
import { getAppMetadata } from "@/components/providers/metadata";
import clsx from "clsx";
import type { Metadata } from "next";

export default function MemeSubscriptions() {
  return (
    <main
      className={clsx(
        styles["main"],
        "tailwind-scope",
        ABOUT_PAGE_SURFACE_CLASS_NAME
      )}
    >
      <CommunityDownloadsSubscriptions />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Meme Subscriptions | Open Data",
    description: "Open Data",
  });
}
