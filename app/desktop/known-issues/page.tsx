import type { Metadata } from "next";

import DesktopDocPage from "@/components/desktop-page/DesktopDocPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import { getDesktopKnownIssuesMarkdown } from "@/lib/desktop-releases/content";
import { getDesktopPageMetadata } from "@/lib/desktop-releases/pageMetadata";

export default function DesktopKnownIssuesRoute() {
  return (
    <DesktopDocPage
      section="known-issues"
      eyebrow={t(DEFAULT_LOCALE, "desktopPage.knownIssues.eyebrow")}
      title={t(DEFAULT_LOCALE, "desktopPage.knownIssues.title")}
      lead={t(DEFAULT_LOCALE, "desktopPage.knownIssues.lead")}
      parts={[{ markdown: getDesktopKnownIssuesMarkdown() }]}
    />
  );
}

export const metadata: Metadata = getDesktopPageMetadata(
  "desktopPage.meta.knownIssues.title",
  "desktopPage.meta.knownIssues.description"
);
