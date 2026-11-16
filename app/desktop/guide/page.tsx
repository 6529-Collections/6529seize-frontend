import type { Metadata } from "next";
import { connection } from "next/server";

import DesktopDocPage from "@/components/desktop-page/DesktopDocPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import { getDesktopGuideMarkdown } from "@/lib/desktop-releases/content";
import { getDesktopPageMetadata } from "@/lib/desktop-releases/pageMetadata";
import {
  getDesktopReleases,
  getNewestDesktopRelease,
} from "@/lib/desktop-releases/releases";

export default async function DesktopGuideRoute() {
  await connection();
  const { releases } = await getDesktopReleases();
  return (
    <DesktopDocPage
      section="guide"
      eyebrow={t(DEFAULT_LOCALE, "desktopPage.guide.eyebrow")}
      title={t(DEFAULT_LOCALE, "desktopPage.guide.title")}
      lead={t(DEFAULT_LOCALE, "desktopPage.guide.lead")}
      markdown={getDesktopGuideMarkdown(getNewestDesktopRelease(releases))}
    />
  );
}

export const metadata: Metadata = getDesktopPageMetadata(
  "desktopPage.meta.guide.title",
  "desktopPage.meta.guide.description"
);
