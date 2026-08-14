import { MuseumSectionHeading } from "../MuseumShell";
import { MuseumResearchBrowse } from "./MuseumResearchBrowse";
import { MuseumResearchDocumentCard } from "./MuseumResearchDocumentCard";
import { MuseumResearchStoryCard } from "./MuseumResearchStoryCard";
import type { MuseumResearchBrowseGroup } from "./MuseumResearchBrowse";
import type { MuseumResearchDocumentCardEntry } from "./MuseumResearchDocumentCard";
import type { MuseumResearchStoryCardProps } from "./MuseumResearchStoryCard";

function selectEditorialEntries(
  entries: readonly MuseumResearchDocumentCardEntry[],
  limit = 4
): readonly MuseumResearchDocumentCardEntry[] {
  const illustrated = entries.filter((entry) => entry.media !== undefined);
  const textOnly = entries.filter((entry) => entry.media === undefined);
  return [...illustrated, ...textOnly].slice(0, limit);
}

interface MuseumResearchLandingSectionProps {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly entries: readonly MuseumResearchDocumentCardEntry[];
}

export function MuseumResearchLanding({
  eyebrow,
  title,
  description,
  featured,
  launchEntries,
  sections,
  browseGroups,
  browseTitle,
  browseDescription,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly featured: MuseumResearchStoryCardProps;
  readonly launchEntries: readonly MuseumResearchDocumentCardEntry[];
  readonly sections: readonly MuseumResearchLandingSectionProps[];
  readonly browseGroups: readonly MuseumResearchBrowseGroup[];
  readonly browseTitle: string;
  readonly browseDescription: string;
}) {
  return (
    <section>
      <MuseumSectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="tw-space-y-16">
        <MuseumResearchStoryCard {...featured} />
        {launchEntries.length === 0 ? null : (
          <section
            aria-labelledby="museum-research-launch-title"
            className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
          >
            <div className="tw-max-w-3xl">
              <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
                Selected publications
              </p>
              <h2
                id="museum-research-launch-title"
                className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
              >
                Casey, Magnum, and Keys and Gates
              </h2>
              <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
                Three entry points connect artists, photographic history, and
                the Museum&apos;s active selection work.
              </p>
            </div>
            <ul className="tw-m-0 tw-mt-7 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-12 tw-p-0 md:tw-grid-cols-2">
              {launchEntries.map((entry) => (
                <li key={entry.id} className="tw-min-w-0">
                  <MuseumResearchDocumentCard entry={entry} headingLevel={3} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {sections.map((section) => {
          const editorialEntries = selectEditorialEntries(section.entries);
          if (editorialEntries.length === 0) return null;
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
              <ul className="tw-m-0 tw-mt-7 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-12 tw-p-0 md:tw-grid-cols-2 xl:tw-grid-cols-3">
                {editorialEntries.map((entry) => (
                  <li key={entry.id} className="tw-min-w-0">
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
        <MuseumResearchBrowse
          groups={browseGroups}
          title={browseTitle}
          description={browseDescription}
        />
      </div>
    </section>
  );
}
