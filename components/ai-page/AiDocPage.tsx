import ReleaseSectionDoc from "@/components/release-section/ReleaseSectionDoc";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import AiPageFrame, { type AiSection } from "./AiPageFrame";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/** A text page under /ai: the guide or the known issues. */
export default function AiDocPage({
  section,
  eyebrow,
  title,
  lead,
  markdown,
}: {
  readonly section: AiSection;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string | undefined;
  readonly markdown: string;
}) {
  return (
    <AiPageFrame current={section} eyebrow={eyebrow} title={title} lead={lead}>
      <ReleaseSectionDoc
        contentsId="ai-doc-contents"
        contentsLabel={t(LOCALE, "ai.doc.contents")}
        markdown={markdown}
      />
    </AiPageFrame>
  );
}
