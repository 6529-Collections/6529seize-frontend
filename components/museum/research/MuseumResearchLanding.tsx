import { MuseumSectionHeading } from "../MuseumShell";
import { MuseumResearchBrowse } from "./MuseumResearchBrowse";
import { MuseumResearchDocumentCard } from "./MuseumResearchDocumentCard";
import type {
  MuseumResearchBrowseGroup,
  MuseumResearchBrowseLabels,
} from "./MuseumResearchBrowse";
import type { MuseumResearchDocumentCardEntry } from "./MuseumResearchDocumentCard";

interface MuseumResearchLandingSectionProps {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly entries: readonly MuseumResearchDocumentCardEntry[];
  readonly columns?: 2 | 3;
  readonly layout?: "standard" | "tablet-lead";
}

export function MuseumResearchLanding({
  eyebrow,
  title,
  description,
  sections,
  browseGroups,
  browseTitle,
  browseDescription,
  browseOpenLabel,
  browseLabels,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly sections: readonly MuseumResearchLandingSectionProps[];
  readonly browseGroups: readonly MuseumResearchBrowseGroup[];
  readonly browseTitle: string;
  readonly browseDescription: string;
  readonly browseOpenLabel: string;
  readonly browseLabels: MuseumResearchBrowseLabels;
}) {
  return (
    <section>
      <MuseumSectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="tw-space-y-20">
        {sections.map((section) => {
          if (section.entries.length === 0) return null;
          const gridColumns =
            section.columns === 2
              ? "md:tw-grid-cols-2"
              : "md:tw-grid-cols-2 xl:tw-grid-cols-3";
          return (
            <section
              key={section.id}
              aria-labelledby={`museum-research-section-${section.id}`}
              className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
            >
              <header className="tw-max-w-4xl">
                <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
                  {section.eyebrow}
                </p>
                <h2
                  id={`museum-research-section-${section.id}`}
                  className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
                >
                  {section.title}
                </h2>
                <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
                  {section.description}
                </p>
              </header>
              <ul
                className={`tw-m-0 tw-mt-7 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-14 tw-p-0 ${gridColumns}`}
              >
                {section.entries.map((entry, index) => (
                  <li
                    key={entry.id}
                    className={
                      section.layout === "tablet-lead" && index === 0
                        ? "tw-min-w-0 md:tw-col-span-2 xl:tw-col-span-1"
                        : "tw-min-w-0"
                    }
                  >
                    <MuseumResearchDocumentCard
                      entry={entry}
                      headingLevel={3}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <details className="tw-group tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
          <summary className="hover:tw-text-primary-200 tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-text-base tw-font-semibold tw-text-primary-300 marker:tw-hidden focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 [&::-webkit-details-marker]:tw-hidden">
            <span>{browseOpenLabel}</span>
            <span aria-hidden="true" className="tw-text-xl">
              <span className="group-open:tw-hidden">+</span>
              <span className="tw-hidden group-open:tw-inline">−</span>
            </span>
          </summary>
          <MuseumResearchBrowse
            groups={browseGroups}
            title={browseTitle}
            description={browseDescription}
            labels={browseLabels}
          />
        </details>
      </div>
    </section>
  );
}
