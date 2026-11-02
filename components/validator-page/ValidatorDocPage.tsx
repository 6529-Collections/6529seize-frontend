import ValidatorMarkdown, { getMarkdownSections } from "./ValidatorMarkdown";
import ValidatorPageFrame, {
  ValidatorPageHeader,
  type ValidatorSection,
} from "./ValidatorPageFrame";

export default function ValidatorDocPage({
  section,
  eyebrow,
  title,
  markdown,
  withContents = false,
}: {
  readonly section: ValidatorSection;
  readonly eyebrow: string;
  readonly title: string;
  readonly markdown: string;
  readonly withContents?: boolean | undefined;
}) {
  const sections = withContents ? getMarkdownSections(markdown) : [];
  return (
    <ValidatorPageFrame current={section}>
      <ValidatorPageHeader eyebrow={eyebrow} title={title} />
      {sections.length > 0 && (
        <nav
          aria-labelledby="validator-doc-contents"
          className="tw-mb-10 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 tw-p-5"
        >
          <h2
            id="validator-doc-contents"
            className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
          >
            On this page
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
    </ValidatorPageFrame>
  );
}
