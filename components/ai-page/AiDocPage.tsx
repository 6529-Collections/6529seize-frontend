import ValidatorMarkdown, {
  getMarkdownSections,
} from "@/components/validator-page/ValidatorMarkdown";
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
  const sections = getMarkdownSections(markdown);
  return (
    <AiPageFrame current={section} eyebrow={eyebrow} title={title} lead={lead}>
      {sections.length > 2 && (
        <nav
          aria-labelledby="ai-doc-contents"
          className="tw-mb-10 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 tw-p-5"
        >
          <h2
            id="ai-doc-contents"
            className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
          >
            {t(LOCALE, "ai.doc.contents")}
          </h2>
          <ol className="tw-mb-0 tw-mt-3 tw-grid tw-list-decimal tw-gap-x-8 tw-gap-y-1.5 tw-pl-5 tw-text-sm marker:tw-text-iron-500 sm:tw-grid-cols-2">
            {sections.map((entry) => (
              <li key={entry.id} className="tw-pl-1">
                <a
                  href={`#${entry.id}`}
                  className="tw-text-iron-200 tw-no-underline hover:tw-text-primary-300"
                >
                  {entry.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <article className="tw-max-w-3xl">
        <ValidatorMarkdown markdown={markdown} />
      </article>
    </AiPageFrame>
  );
}
