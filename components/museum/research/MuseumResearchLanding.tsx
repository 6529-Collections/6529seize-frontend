import { MuseumSectionHeading } from "../MuseumShell";
import { MuseumResearchBrowse } from "./MuseumResearchBrowse";
import { MuseumResearchDocumentCard } from "./MuseumResearchDocumentCard";
import { MuseumResearchStoryCard } from "./MuseumResearchStoryCard";
import type { MuseumResearchBrowseGroup } from "./MuseumResearchBrowse";
import type { MuseumResearchDocumentCardEntry } from "./MuseumResearchDocumentCard";
import type { MuseumResearchStoryCardProps } from "./MuseumResearchStoryCard";

interface MuseumResearchLandingGroup {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly entries: readonly MuseumResearchDocumentCardEntry[];
}

interface MuseumResearchLandingTier {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly groups: readonly MuseumResearchLandingGroup[];
}

function selectEditorialEntries(
  entries: readonly MuseumResearchDocumentCardEntry[]
): readonly MuseumResearchDocumentCardEntry[] {
  const illustrated = entries.filter((entry) => entry.media !== undefined);
  const textOnly = entries.filter((entry) => entry.media === undefined);
  return [...illustrated, ...textOnly].slice(0, 3);
}

export function MuseumResearchLanding({
  eyebrow,
  title,
  description,
  featured,
  tiers,
  browseGroups,
  browseTitle,
  browseDescription,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly featured: MuseumResearchStoryCardProps;
  readonly tiers: readonly MuseumResearchLandingTier[];
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
        {tiers.map((tier) => {
          if (tier.groups.length === 0) return null;
          return (
            <section
              key={tier.id}
              aria-labelledby={`museum-research-tier-${tier.id}`}
              className="tw-space-y-10"
            >
              <header className="tw-max-w-4xl tw-border-l-2 tw-border-solid tw-border-primary-400 tw-pl-5 sm:tw-pl-6">
                <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
                  {tier.eyebrow}
                </p>
                <h2
                  id={`museum-research-tier-${tier.id}`}
                  className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
                >
                  {tier.title}
                </h2>
                <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
                  {tier.description}
                </p>
              </header>
              <div className="tw-space-y-12">
                {tier.groups.map((group) => {
                  const imageLedEntries = selectEditorialEntries(group.entries);
                  if (imageLedEntries.length === 0) return null;
                  return (
                    <section
                      key={group.id}
                      aria-labelledby={`museum-research-group-${group.id}`}
                      className="tw-min-w-0"
                    >
                      <div className="tw-max-w-3xl">
                        <h3
                          id={`museum-research-group-${group.id}`}
                          className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-2xl"
                        >
                          {group.title}
                        </h3>
                        <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
                          {group.description}
                        </p>
                      </div>
                      <ul className="tw-m-0 tw-mt-6 tw-grid tw-list-none tw-gap-6 tw-p-0 md:tw-grid-cols-2 xl:tw-grid-cols-3">
                        {imageLedEntries.map((entry) => (
                          <li key={entry.id} className="tw-min-w-0">
                            <MuseumResearchDocumentCard
                              entry={entry}
                              headingLevel={4}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
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
