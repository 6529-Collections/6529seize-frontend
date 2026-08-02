import type { Metadata } from "next";
import Link from "next/link";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ACCESSION_ID,
  caseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.stories.title"),
  description: t(DEFAULT_LOCALE, "museum.network.stories.description"),
});

export default async function MuseumStoriesPage() {
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artworks = caseyArtworksFromPublication(publicationState.publication);
  return (
    <div>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.stories.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.stories.title")}
        description={t(DEFAULT_LOCALE, "museum.network.stories.description")}
      />
      <div className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 lg:tw-grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.15fr)] lg:tw-items-center">
        <MuseumArtworkFigure
          artwork={artworks[6]!}
          href={`/museum/network/gifts/${CASEY_ACCESSION_ID}#gift-essay-title`}
          sizes="(min-width: 1024px) 45vw, 100vw"
        />
        <article>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.stories.collectionEssay")}
          </p>
          <h2 className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50">
            The executable image: rule, behavior, room, cosmos
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.stories.caseyEssaySummary")}
          </p>
          <Link
            href={`/museum/network/gifts/${CASEY_ACCESSION_ID}#gift-essay-title`}
            className="hover:tw-text-primary-200 tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.stories.readEssay")}
          </Link>
        </article>
      </div>
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-8">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.stories.artistResearch")}
        </p>
        <h2 className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50">
          Casey Reas: artist and practice profile
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.stories.artistSummary")}
        </p>
        <Link
          href="/museum/network/artists/casey-reas#artist-profile-title"
          className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.stories.readResearch")}
        </Link>
      </div>
    </div>
  );
}
