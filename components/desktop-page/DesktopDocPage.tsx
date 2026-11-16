import ReleaseSectionDoc from "@/components/release-section/ReleaseSectionDoc";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import DesktopPageFrame, { type DesktopSection } from "./DesktopPageFrame";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/** A text page under /desktop: the guide or the known issues. */
export default function DesktopDocPage({
  section,
  eyebrow,
  title,
  lead,
  markdown,
}: {
  readonly section: DesktopSection;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly markdown: string;
}) {
  return (
    <DesktopPageFrame
      current={section}
      eyebrow={eyebrow}
      title={title}
      lead={lead}
    >
      <ReleaseSectionDoc
        contentsId="desktop-doc-contents"
        contentsLabel={t(LOCALE, "desktopPage.doc.contents")}
        markdown={markdown}
      />
    </DesktopPageFrame>
  );
}
