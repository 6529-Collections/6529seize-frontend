import { MuseumMarkdown } from "../MuseumMarkdown";

export function MuseumResearchReading({
  selectedMarkdown,
  completeMarkdown,
  sourceCommit,
  sourcePath,
  workHrefs,
  selectedTitle,
  selectedDescription,
  completeLabel,
  completeDescription,
}: {
  readonly selectedMarkdown?: string;
  readonly completeMarkdown: string;
  readonly sourceCommit: string | null;
  readonly sourcePath: string;
  readonly workHrefs?: Readonly<Record<string, string>>;
  readonly selectedTitle: string;
  readonly selectedDescription: string;
  readonly completeLabel: string;
  readonly completeDescription: string;
}) {
  return (
    <>
      {selectedMarkdown === undefined ||
      selectedMarkdown.trim() === "" ? null : (
        <section
          id="selected-reading"
          aria-labelledby="selected-reading-title"
          className="tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        >
          <h2
            id="selected-reading-title"
            className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50"
          >
            {selectedTitle}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
            {selectedDescription}
          </p>
          <MuseumMarkdown
            className="tw-mt-8"
            documentHeadings
            nestedDocumentHeadings
            sourceCommit={sourceCommit}
            sourcePath={sourcePath}
            workHrefs={workHrefs}
          >
            {selectedMarkdown}
          </MuseumMarkdown>
        </section>
      )}

      <details
        id="complete-research-record"
        open={selectedMarkdown === undefined || selectedMarkdown.trim() === ""}
        className="tw-group tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-1"
      >
        <summary className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-6 tw-py-4 tw-text-base tw-font-semibold tw-text-primary-300 marker:tw-hidden focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 [&::-webkit-details-marker]:tw-hidden">
          <span className="tw-flex tw-flex-col">
            <span
              role="heading"
              aria-level={2}
              className="tw-text-base tw-font-semibold tw-text-primary-300"
            >
              {completeLabel}
            </span>
            <span className="tw-mt-1 tw-block tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400">
              {completeDescription}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="tw-text-xl tw-text-iron-400 group-open:tw-rotate-45"
          >
            +
          </span>
        </summary>
        <MuseumMarkdown
          className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pb-8 tw-pt-6"
          documentHeadings
          nestedDocumentHeadings
          embeddedDocument
          sourceCommit={sourceCommit}
          sourcePath={sourcePath}
          workHrefs={workHrefs}
        >
          {completeMarkdown}
        </MuseumMarkdown>
      </details>
    </>
  );
}
