import type { Metadata } from "next";
import Link from "next/link";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import {
  museumProjectHref,
  museumWorkHref,
} from "@/lib/museum/publication/routes";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.projects.title"),
    description: t(DEFAULT_LOCALE, "museum.network.projects.description"),
  }),
  alternates: { canonical: "/museum/network/projects" },
};

export default async function MuseumProjectsPage() {
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.projects.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.projects.title")}
        description={t(DEFAULT_LOCALE, "museum.network.projects.description")}
      />
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-8 tw-p-0 md:tw-grid-cols-2 xl:tw-grid-cols-3">
        {publication.projects.map((project) => {
          const work = (publication.works ?? []).find(
            (candidate) =>
              candidate.projectId === project.id ||
              project.workIds?.includes(candidate.id) === true
          );
          const artist = publication.artists.find(
            (candidate) =>
              candidate.id === project.artistId ||
              project.artistIds?.includes(candidate.id) === true
          );
          const media =
            work === undefined ? undefined : selectMuseumStillMedia(work.media);
          return (
            <li key={project.id} className="tw-min-w-0">
              {media !== undefined ? (
                <MuseumPublicMediaFigure
                  src={media.url}
                  width={media.width}
                  height={media.height}
                  alt={media.altText ?? ""}
                  href={museumProjectHref(project.slug)}
                  title={project.title}
                  byline={artist?.preferredName ?? ""}
                />
              ) : (
                <div className="tw-border-x-0 tw-border-b tw-border-t tw-border-solid tw-border-iron-800 tw-py-5">
                  <Link
                    href={museumProjectHref(project.slug)}
                    className="hover:tw-text-primary-200 tw-text-xl tw-font-semibold tw-text-iron-50 tw-underline-offset-4 hover:tw-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {project.title}
                  </Link>
                  {artist ? (
                    <p className="tw-m-2 tw-mb-0 tw-text-sm tw-text-iron-400">
                      {artist.preferredName}
                    </p>
                  ) : null}
                  <p className="tw-m-0 tw-mt-4 tw-text-xs tw-text-iron-500">
                    {project.workIds?.length ?? project.artworkIds.length} works
                  </p>
                </div>
              )}
              {work?.media.length === 0 ? (
                <Link
                  href={museumWorkHref(work.id)}
                  className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {work.title}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
