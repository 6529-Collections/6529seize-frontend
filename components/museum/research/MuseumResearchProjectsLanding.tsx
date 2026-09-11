import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MuseumSectionHeading } from "../MuseumShell";
import {
  MuseumResearchProjectCard,
  type MuseumResearchProjectCardData,
} from "./MuseumResearchProjectCard";
import { MuseumResearchStoryCard } from "./MuseumResearchStoryCard";

export function MuseumResearchProjectsLanding({
  eyebrow,
  title,
  description,
  distinctionTitle,
  distinctionDescription,
  featuredDescription,
  featured,
  projects,
  browseTitle,
  collectionLabel,
  collectionHref,
  acquisitionsLabel,
  acquisitionsHref,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly distinctionTitle: string;
  readonly distinctionDescription: string;
  readonly featuredDescription: string;
  readonly featured: MuseumResearchProjectCardData;
  readonly projects: readonly MuseumResearchProjectCardData[];
  readonly browseTitle: string;
  readonly collectionLabel: string;
  readonly collectionHref: string;
  readonly acquisitionsLabel: string;
  readonly acquisitionsHref: string;
}) {
  return (
    <section>
      <MuseumSectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="tw-space-y-12">
        <aside className="tw-max-w-4xl tw-border-l-2 tw-border-solid tw-border-primary-400 tw-pl-5 sm:tw-pl-6">
          <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
            {distinctionTitle}
          </h2>
          <p className="tw-m-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
            {distinctionDescription}
          </p>
          <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2">
            <Link
              href={collectionHref}
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {collectionLabel}
            </Link>
            <Link
              href={acquisitionsHref}
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {acquisitionsLabel}
            </Link>
          </div>
        </aside>
        <MuseumResearchStoryCard
          href={featured.href}
          eyebrow={featured.artistNames.join(", ")}
          title={featured.title}
          description={featuredDescription}
          media={featured.media}
          actionLabel={t(DEFAULT_LOCALE, "museum.network.projects.openProject")}
        />
        <section aria-labelledby="museum-projects-browse-title">
          <div className="tw-max-w-3xl">
            <h2
              id="museum-projects-browse-title"
              className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50 sm:tw-text-3xl"
            >
              {browseTitle}
            </h2>
          </div>
          <ul className="tw-m-0 tw-mt-6 tw-grid tw-list-none tw-gap-6 tw-p-0 md:tw-grid-cols-2 xl:tw-grid-cols-3">
            {projects.map((project) => (
              <li key={project.id} className="tw-min-w-0">
                <MuseumResearchProjectCard project={project} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
