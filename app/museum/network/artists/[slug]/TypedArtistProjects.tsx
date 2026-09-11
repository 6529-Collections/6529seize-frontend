import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumProject } from "@/lib/museum/publication/types";

interface TypedArtistProjectsProps {
  readonly projects: readonly MuseumProject[];
}

export function TypedArtistProjects({ projects }: TypedArtistProjectsProps) {
  return (
    <section className="tw-mt-16" aria-labelledby="typed-artist-projects-title">
      <h2
        id="typed-artist-projects-title"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {t(DEFAULT_LOCALE, "museum.network.artists.projects")}
      </h2>
      <ul className="tw-m-0 tw-mt-5 tw-list-none tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-0">
        {projects.map((project) => (
          <li
            key={project.id}
            className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
          >
            <Link
              href={`/museum/network/projects/${encodeURIComponent(project.slug)}`}
              className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-items-center tw-justify-between tw-gap-4 tw-py-4 tw-text-base tw-font-semibold tw-text-iron-100 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <span>{project.title}</span>
              <span className="tw-text-sm tw-font-normal tw-text-iron-500">
                {t(
                  DEFAULT_LOCALE,
                  (project.workIds?.length ?? project.artworkIds.length) === 1
                    ? "museum.network.projects.workCount.one"
                    : "museum.network.projects.workCount.other",
                  {
                    count: project.workIds?.length ?? project.artworkIds.length,
                  }
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
