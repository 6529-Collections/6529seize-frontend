import type { Metadata } from "next";
import Link from "next/link";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { museumAcquisitionProgramHref } from "@/lib/museum/publication/routes";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.title"),
  description: t(
    DEFAULT_LOCALE,
    "museum.network.acquisitionPrograms.description"
  ),
});

export default async function MuseumAcquisitionProgramsPage() {
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;
  const programs = publication.acquisitionPrograms ?? [];
  if (programs.length === 0 && view === null)
    return <MuseumPublicationUnavailable />;

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(
          DEFAULT_LOCALE,
          "museum.network.acquisitionPrograms.eyebrow"
        )}
        title={t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.title")}
        description={t(
          DEFAULT_LOCALE,
          "museum.network.acquisitionPrograms.description"
        )}
      />
      <ul className="tw-m-0 tw-list-none tw-border-y tw-border-solid tw-border-iron-800 tw-p-0">
        {programs.map((program) => (
          <li
            key={program.id}
            className="tw-border-b tw-border-solid tw-border-iron-800 last:tw-border-b-0"
          >
            <Link
              href={museumAcquisitionProgramHref(program.slug)}
              className="tw-flex tw-min-h-20 tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-py-5 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <span>
                <span className="hover:tw-text-primary-200 tw-block tw-text-lg tw-font-semibold tw-text-iron-50">
                  {program.title}
                </span>
                <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
                  {program.acquisitionIds.length}{" "}
                  {t(
                    DEFAULT_LOCALE,
                    "museum.network.acquisitionPrograms.acquisitions"
                  ).toLocaleLowerCase()}
                </span>
              </span>
              <span className="tw-text-sm tw-text-primary-300">
                {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.view")}
              </span>
            </Link>
          </li>
        ))}
        {programs.length === 0 &&
          view?.programs.map((program) => (
            <li
              key={program.programId}
              className="tw-border-b tw-border-solid tw-border-iron-800 last:tw-border-b-0"
            >
              <Link
                href={museumAcquisitionProgramHref("keys-and-gates")}
                className="tw-flex tw-min-h-20 tw-items-center tw-justify-between tw-gap-4 tw-py-5 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
                  {program.title}
                </span>
                <span className="tw-text-sm tw-text-primary-300">
                  {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.view")}
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
