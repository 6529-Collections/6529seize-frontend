import type { ReactNode } from "react";

import ReleaseFigure from "@/components/release-section/ReleaseFigure";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import {
  getDesktopGuideSections,
  type DesktopGuideSection,
} from "@/lib/desktop-releases/content";
import type { DesktopRelease } from "@/lib/desktop-releases/releases";
import DesktopDocPage from "./DesktopDocPage";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

// Real captures of 6529 Desktop, cropped to the app's own window or dialog.
const FIGURES: Partial<Record<DesktopGuideSection, ReactNode>> = {
  mac: (
    <ReleaseFigure
      src="/desktop/guide-first-launch-mac.webp"
      width={1024}
      height={440}
      alt={t(LOCALE, "desktopPage.guide.figure.mac.alt")}
      caption={t(LOCALE, "desktopPage.guide.figure.mac.caption")}
    />
  ),
  browserSigning: (
    <ReleaseFigure
      src="/desktop/guide-signature-request.webp"
      width={671}
      height={557}
      maxWidth={420}
      alt={t(LOCALE, "desktopPage.guide.figure.signature.alt")}
      caption={t(LOCALE, "desktopPage.guide.figure.signature.caption")}
    />
  ),
};

/** The guide, with screenshots after the sections that have one. */
export default function DesktopGuide({
  release,
}: {
  readonly release: DesktopRelease | undefined;
}) {
  return (
    <DesktopDocPage
      section="guide"
      eyebrow={t(LOCALE, "desktopPage.guide.eyebrow")}
      title={t(LOCALE, "desktopPage.guide.title")}
      lead={t(LOCALE, "desktopPage.guide.lead")}
      parts={getDesktopGuideSections(release).map((entry) => ({
        markdown: entry.markdown,
        after: FIGURES[entry.id],
      }))}
    />
  );
}
