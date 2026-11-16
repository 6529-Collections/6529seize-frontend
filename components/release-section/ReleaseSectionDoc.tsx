import ValidatorMarkdown, {
  getMarkdownSections,
} from "@/components/validator-page/ValidatorMarkdown";

/**
 * The body of a text page in a release section (a guide, the known
 * issues): a table of contents when the page has more than two sections,
 * then the Markdown.
 */
export default function ReleaseSectionDoc({
  contentsId,
  contentsLabel,
  markdown,
}: {
  /** The id of the contents heading. */
  readonly contentsId: string;
  readonly contentsLabel: string;
  readonly markdown: string;
}) {
  const sections = getMarkdownSections(markdown);
  return (
    <>
      {sections.length > 2 && (
        <nav
          aria-labelledby={contentsId}
          className="tw-mb-10 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 tw-p-5"
        >
          <h2
            id={contentsId}
            className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
          >
            {contentsLabel}
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
    </>
  );
}
