import type { Metadata } from "next";
import Link from "next/link";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumLandingHero } from "@/components/museum/landing/MuseumLandingHero";
import {
  MuseumLandingMediaCard,
  type MuseumLandingMedia,
} from "@/components/museum/landing/MuseumLandingMediaCard";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { tryCaseyArtworksFromPublication } from "@/lib/museum/casey";
import {
  applyMuseumCollectionSemantics,
  isMuseumPermanentCollectionWork,
} from "@/lib/museum/publication/collectionSemantics";
import { buildMuseumAcquisitionIndex } from "@/lib/museum/publication/ia";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import {
  museumAcquisitionHref,
  museumWorkHref,
  museumWorkHrefForSourceId,
} from "@/lib/museum/publication/routes";
import type {
  MuseumMediaMetadata,
  MuseumPublication,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication/types";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.collection.title"),
    description: t(DEFAULT_LOCALE, "museum.network.collection.description"),
  }),
  alternates: { canonical: "/museum/network/collection" },
};

type CollectionItem = {
  readonly id: string;
  readonly title: string;
  readonly href: string | null;
  readonly subtitle: string;
  readonly media?: MuseumLandingMedia;
  readonly metadata?: MuseumMediaMetadata;
};

function collectionCountLabel(count: number): string {
  return t(
    DEFAULT_LOCALE,
    count === 1
      ? "museum.network.acquisitions.worksCount.one"
      : "museum.network.acquisitions.worksCount.other",
    { count: formatInteger(DEFAULT_LOCALE, count) }
  );
}

function publicWorkItem(
  work: MuseumPublicWork,
  publication: MuseumPublication
): CollectionItem {
  const artist = publication.artists.find(
    (candidate) => candidate.id === work.artistId
  );
  const media = selectMuseumStillMedia(work.media);
  const mediaMetadata = work.mediaMetadata?.[0];
  let presentation: Pick<CollectionItem, "media" | "metadata"> = {};
  if (media !== undefined) {
    presentation = {
      media: {
        kind: "governed" as const,
        src: media.url,
        width: media.width,
        height: media.height,
        alt: media.altText ?? work.title,
        creditLine: media.credit.creditLine,
      },
    };
  } else if (work.presentationMedia?.[0] !== undefined) {
    const presentationMedia = work.presentationMedia[0];
    const sourceHref = buildMuseumSignedWaveStormDropUrl(
      presentationMedia.source.waveId,
      presentationMedia.source.dropId
    );
    presentation = {
      media: {
        kind: "proposal" as const,
        src: presentationMedia.mediaUrl,
        width: presentationMedia.width,
        height: presentationMedia.height,
        alt: presentationMedia.altText.trim() || work.title,
        sourceByteSize: presentationMedia.sourceByteSize,
        ...(presentationMedia.variants === undefined
          ? {}
          : { variants: presentationMedia.variants }),
        creditLine: presentationMedia.credit.creditLine,
        requireIntentForLargeSource: false,
        ...(sourceHref === null ||
        !presentationMedia.affordances.includes("open_upstream_presentation")
          ? {}
          : {
              sourceHref,
              sourceLabel: t(
                DEFAULT_LOCALE,
                "museum.network.acquisitions.openPresentation"
              ),
            }),
      },
      ...(mediaMetadata === undefined ? {} : { metadata: mediaMetadata }),
    };
  } else if (mediaMetadata !== undefined) {
    presentation = { metadata: mediaMetadata };
  }
  return {
    id: work.id,
    title: work.title,
    href: museumWorkHref(work.id),
    subtitle: artist?.preferredName ?? work.artistId,
    ...presentation,
  };
}

function legacyCollectionItems(
  publication: MuseumPublication
): readonly CollectionItem[] {
  return (tryCaseyArtworksFromPublication(publication) ?? []).map(
    (artwork) => ({
      id: artwork.objectId,
      title: artwork.title,
      href: museumWorkHrefForSourceId(publication, artwork.objectId),
      subtitle: `${artwork.project} · ${String(artwork.year)}`,
      media: {
        kind: "governed" as const,
        src: artwork.imageUrl,
        width: null,
        height: null,
        alt: artwork.visualDescription,
        creditLine: artwork.creditLine,
      },
    })
  );
}

function collectionItems(
  publication: MuseumPublication
): readonly CollectionItem[] | null {
  if (publication.works !== undefined) {
    const holdings = publication.works
      .filter((work) => isMuseumPermanentCollectionWork(work))
      .map((work) => publicWorkItem(work, publication));
    return holdings.length === 0 ? null : holdings;
  }
  const legacy = legacyCollectionItems(publication);
  return legacy.length === 0 ? null : legacy;
}

export default async function MuseumCollectionPage() {
  const { publicationState, view } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = applyMuseumCollectionSemantics(
    publicationState.publication
  );

  const holdings = collectionItems(publication);
  if (holdings === null) return <MuseumPublicationUnavailable />;

  const hero =
    holdings.find(
      (item) => item.media !== undefined || item.metadata !== undefined
    ) ?? holdings[0];
  if (hero === undefined) return <MuseumPublicationUnavailable />;
  const holdingIds = new Set(holdings.map((item) => item.id));
  const accessionedAcquisitions = buildMuseumAcquisitionIndex(
    publication,
    view
  ).filter(
    (acquisition) =>
      acquisition.status === "accessioned_into_permanent_collection" &&
      acquisition.workIds.some((workId) => holdingIds.has(workId))
  );
  const completedGiftCount = accessionedAcquisitions.filter(
    (acquisition) =>
      acquisition.acquisitionMethod === "gift" ||
      acquisition.acquisitionMethod === "donation"
  ).length;
  const acquisitionHistoryDescription = t(
    DEFAULT_LOCALE,
    completedGiftCount === accessionedAcquisitions.length
      ? "museum.network.collection.acquisitionHistoryGifts"
      : "museum.network.collection.acquisitionHistoryGeneral",
    {
      workCount: formatInteger(DEFAULT_LOCALE, holdings.length),
      acquisitionCount: formatInteger(
        DEFAULT_LOCALE,
        accessionedAcquisitions.length
      ),
    }
  );

  return (
    <div>
      <MuseumLandingHero
        eyebrow={t(DEFAULT_LOCALE, "museum.network.collection.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.collection.title")}
        description={t(
          DEFAULT_LOCALE,
          "museum.network.collection.heroDescription"
        )}
        {...(hero.media === undefined ? {} : { media: hero.media })}
        {...(hero.metadata === undefined
          ? {}
          : { mediaMetadata: hero.metadata })}
        mediaTitle={hero.title}
        mediaSubtitle={hero.subtitle}
        {...(hero.href === null ? {} : { mediaHref: hero.href })}
        actions={
          <>
            <Link
              href="/museum/network/acquisitions"
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-bg-primary-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-black tw-no-underline hover:tw-bg-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
            >
              {t(
                DEFAULT_LOCALE,
                "museum.network.collection.browseAcquisitions"
              )}
            </Link>
            <Link
              href="/museum/network/artists"
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(DEFAULT_LOCALE, "museum.network.collection.meetArtists")}
            </Link>
          </>
        }
      />

      <section
        className="tw-mt-14 sm:tw-mt-16"
        aria-labelledby="collection-holdings-title"
      >
        <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4">
          <div>
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              {t(DEFAULT_LOCALE, "museum.network.collection.holdingsEyebrow")}
            </p>
            <h2
              id="collection-holdings-title"
              className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-[-0.02em] tw-text-iron-50"
            >
              {t(DEFAULT_LOCALE, "museum.network.collection.holdingsTitle")}
            </h2>
          </div>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {collectionCountLabel(holdings.length)}
          </p>
        </div>
        <p className="tw-m-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.collection.holdingsDescription")}
        </p>
        <div className="tw-mt-8 tw-grid tw-min-w-0 tw-gap-6 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {holdings.map((item, index) => (
            <MuseumLandingMediaCard
              key={item.id}
              {...(item.media === undefined ? {} : { media: item.media })}
              {...(item.metadata === undefined
                ? {}
                : { metadata: item.metadata })}
              {...(item.href === null ? {} : { href: item.href })}
              title={item.title}
              subtitle={item.subtitle}
              eager={index < 2}
            />
          ))}
        </div>
      </section>

      {accessionedAcquisitions.length === 0 ? null : (
        <section
          className="tw-mt-16 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-12 sm:tw-mt-20 sm:tw-pt-16"
          aria-labelledby="collection-acquisitions-title"
        >
          <div className="tw-max-w-2xl">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              {t(DEFAULT_LOCALE, "museum.network.collection.accessionHistory")}
            </p>
            <h2
              id="collection-acquisitions-title"
              className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-[-0.02em] tw-text-iron-50"
            >
              {t(DEFAULT_LOCALE, "museum.network.collection.acquisitionsTitle")}
            </h2>
            <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
              {acquisitionHistoryDescription}
            </p>
          </div>
          <div className="tw-mt-8 tw-grid tw-gap-6 md:tw-grid-cols-2">
            {accessionedAcquisitions.map((acquisition) => {
              const representative = holdings.find((item) =>
                acquisition.workIds.includes(item.id)
              );
              return (
                <MuseumLandingMediaCard
                  key={acquisition.acquisitionId}
                  {...(representative?.media === undefined
                    ? {}
                    : { media: representative.media })}
                  {...(representative?.metadata === undefined
                    ? {}
                    : { metadata: representative.metadata })}
                  href={museumAcquisitionHref(acquisition.slug)}
                  title={acquisition.title}
                  subtitle={collectionCountLabel(acquisition.workIds.length)}
                  creditLine={t(
                    DEFAULT_LOCALE,
                    "museum.network.collection.permanentCollection"
                  )}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
