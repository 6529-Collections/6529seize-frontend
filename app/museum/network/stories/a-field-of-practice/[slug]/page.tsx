import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  InstitutionalPracticeManuscript,
  InstitutionalPracticePublicationLine,
  institutionalPracticePublicationIsComplete,
  projectInstitutionalPracticeManuscript,
} from "@/components/museum/InstitutionalPracticeReadingRoom";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface MuseumInstitutionProfilePageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MuseumInstitutionProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  const profile = institutionalPracticePublicationIsComplete(publication)
    ? publication.institutionalPractice.profiles.find(
        (candidate) => candidate.slug === slug
      )
    : undefined;

  return getAppMetadata({
    title:
      profile?.document.title ??
      t(DEFAULT_LOCALE, "museum.network.institutionalPractice.title"),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.institutionalPractice.profileDescription"
    ),
  });
}

export default async function MuseumInstitutionProfilePage({
  params,
}: MuseumInstitutionProfilePageProps) {
  const { slug } = await params;
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  if (!institutionalPracticePublicationIsComplete(publication)) {
    return <MuseumPublicationUnavailable />;
  }

  const profiles = publication.institutionalPractice.profiles;
  const profileIndex = profiles.findIndex((profile) => profile.slug === slug);
  if (profileIndex === -1) {
    notFound();
  }

  const profile = profiles[profileIndex];
  if (profile === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const projection = projectInstitutionalPracticeManuscript(
    profile.document.markdown
  );
  if (projection?.title !== profile.document.title) {
    return <MuseumPublicationUnavailable />;
  }

  const previousProfile = profiles[profileIndex - 1];
  const nextProfile = profiles[profileIndex + 1];

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/stories/a-field-of-practice"
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.institutionalPractice.backToStudy")}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(
            DEFAULT_LOCALE,
            "museum.network.institutionalPractice.profileEyebrow"
          )}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {projection.title}
        </h1>
        <InstitutionalPracticePublicationLine projection={projection} />
      </header>

      <div className="tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2">
        <InstitutionalPracticeManuscript
          projection={projection}
          sourceCommit={publication.identity.commit}
          sourcePath={profile.document.sourcePath}
        />
      </div>

      <nav
        aria-label={t(
          DEFAULT_LOCALE,
          "museum.network.institutionalPractice.researchApparatus"
        )}
        className="tw-mt-12 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6"
      >
        <Link
          href="/museum/network/stories/a-field-of-practice/sources"
          prefetch={false}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(
            DEFAULT_LOCALE,
            "museum.network.institutionalPractice.readSourceRegister"
          )}
        </Link>
      </nav>

      <nav
        aria-label={t(
          DEFAULT_LOCALE,
          "museum.network.institutionalPractice.profileNavigation"
        )}
        className="tw-mt-12 tw-grid tw-gap-5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6 sm:tw-grid-cols-2"
      >
        {previousProfile === undefined ? (
          <span aria-hidden="true" />
        ) : (
          <Link
            href={`/museum/network/stories/a-field-of-practice/${previousProfile.slug}`}
            prefetch={false}
            className="tw-group tw-min-w-0 tw-py-2 tw-text-left tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(
                DEFAULT_LOCALE,
                "museum.network.institutionalPractice.previousProfile"
              )}
            </span>
            <span className="group-hover:tw-text-primary-200 tw-mt-2 tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
              {previousProfile.document.title}
            </span>
          </Link>
        )}
        {nextProfile === undefined ? null : (
          <Link
            href={`/museum/network/stories/a-field-of-practice/${nextProfile.slug}`}
            prefetch={false}
            className="tw-group tw-min-w-0 tw-py-2 tw-text-left tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-text-right"
          >
            <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(
                DEFAULT_LOCALE,
                "museum.network.institutionalPractice.nextProfile"
              )}
            </span>
            <span className="group-hover:tw-text-primary-200 tw-mt-2 tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
              {nextProfile.document.title}
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
