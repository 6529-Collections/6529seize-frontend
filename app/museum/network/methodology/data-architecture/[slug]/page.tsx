import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DataArchitectureManuscript,
  DataArchitectureScheduleDisclosure,
  dataArchitecturePublicationIsComplete,
} from "@/components/museum/DataArchitectureReadingRoom";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface DataArchitectureProfilePageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DataArchitectureProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const state = await getMuseumPublicationState();
  const publication = state.publication;
  if (!dataArchitecturePublicationIsComplete(publication)) {
    return getAppMetadata({
      title: t(DEFAULT_LOCALE, "museum.network.dataArchitecture.shortTitle"),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.dataArchitecture.profilePageDescription"
      ),
    });
  }
  const document =
    slug === "casey-reas-implementation"
      ? publication.dataArchitecture.caseyImplementation
      : publication.dataArchitecture.standards.find(
          (standard) => standard.slug === slug
        )?.document;
  return getAppMetadata({
    title:
      document?.title ??
      t(DEFAULT_LOCALE, "museum.network.dataArchitecture.shortTitle"),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.dataArchitecture.profilePageDescription"
    ),
  });
}

export default async function MuseumDataArchitectureProfilePage({
  params,
}: DataArchitectureProfilePageProps) {
  const { slug } = await params;
  const state = await getMuseumPublicationState();
  const publication = state.publication;
  if (!dataArchitecturePublicationIsComplete(publication)) {
    return <MuseumPublicationUnavailable />;
  }
  const isCasey = slug === "casey-reas-implementation";
  const standard = publication.dataArchitecture.standards.find(
    (candidate) => candidate.slug === slug
  );
  const document = isCasey
    ? publication.dataArchitecture.caseyImplementation
    : standard?.document;
  if (document === undefined) notFound();

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/methodology/data-architecture"
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(
          DEFAULT_LOCALE,
          "museum.network.dataArchitecture.backToArchitecture"
        )}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(
            DEFAULT_LOCALE,
            isCasey
              ? "museum.network.dataArchitecture.caseyEyebrow"
              : "museum.network.dataArchitecture.standardEyebrow"
          )}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {document.title}
        </h1>
        {standard === undefined ? null : (
          <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-lg tw-leading-8 tw-text-iron-300">
            {standard.humanQuestion}
          </p>
        )}
      </header>
      <div className="tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2">
        <DataArchitectureManuscript
          markdown={document.markdown}
          sourceCommit={publication.identity.commit}
          sourcePath={document.sourcePath}
        />
      </div>
      {isCasey ? (
        <section className="tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
          <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
            {t(DEFAULT_LOCALE, "museum.network.dataArchitecture.scheduleTitle")}
          </h2>
          <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "museum.network.dataArchitecture.scheduleDescription"
            )}
          </p>
          <div className="tw-mt-5">
            <DataArchitectureScheduleDisclosure publication={publication} />
          </div>
        </section>
      ) : null}
    </article>
  );
}
