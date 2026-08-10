import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumRightsGuideManuscript } from "@/components/museum/MuseumRightsReadingRoom";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.rights.artistGuideTitle"),
  description: t(
    DEFAULT_LOCALE,
    "museum.network.rights.artistGuideDescription"
  ),
});

export async function renderMuseumRightsForArtistsPage() {
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  if (publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const document = publication.rightsHandbook.artistGuide;

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/research/rights"
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.rights.backToHandbook")}
      </Link>
      <header className="tw-mt-6 tw-max-w-5xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.rights.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-max-w-4xl tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {document.title}
        </h1>
        <p className="tw-m-0 tw-mt-6 tw-max-w-4xl tw-text-lg tw-leading-8 tw-text-iron-200">
          {t(DEFAULT_LOCALE, "museum.network.rights.artistGuideDescription")}
        </p>
      </header>
      <MuseumRightsGuideManuscript
        document={document}
        sourceCommit={publication.identity.commit}
      />
    </article>
  );
}

export default function MuseumRightsForArtistsLegacyPage() {
  permanentRedirect("/museum/network/research/rights/artists");
}
