import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkViewer } from "./MuseumArtworkViewer";
import { MuseumJsonDisclosure, MuseumMarkdown } from "./MuseumMarkdown";
import { MuseumPublicationUnavailable } from "./MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ACCESSION_ID,
  CASEY_ARTIST_NAME,
  CASEY_ARTIST_SLUG,
  tryCaseyArtworksFromPublication,
  getCaseyArtwork,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

export function getMuseumObjectMetadata(objectId: string): Metadata {
  const artwork = getCaseyArtwork(objectId);
  return getAppMetadata({
    title: artwork?.title ?? t(DEFAULT_LOCALE, "museum.network.objects.title"),
    description:
      artwork?.visualDescription ??
      t(DEFAULT_LOCALE, "museum.network.objects.description"),
  });
}

export async function MuseumObjectPage({
  objectId,
}: {
  readonly objectId: string;
}) {
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = publicationState.publication;
  const artworks = tryCaseyArtworksFromPublication(publication);
  if (artworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artwork = artworks.find((item) => item.objectId === objectId);
  if (artwork === undefined) {
    notFound();
  }

  const objectDocument = publication.documents.find(
    (document) =>
      document.kind === "object_entry" &&
      document.artworkIds.includes(artwork.objectId)
  );
  const objectRecord = publication.artworks.find(
    (item) => item.id === artwork.objectId
  );

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/collection"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.objects.backToCollection")}
      </Link>

      <header className="tw-mb-8 tw-mt-6 tw-grid tw-gap-5 md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-end">
        <div>
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-primary-300">
            <Link
              href={`/museum/network/artists/${CASEY_ARTIST_SLUG}`}
              className="hover:tw-text-primary-200 tw-text-inherit tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {CASEY_ARTIST_NAME}
            </Link>
          </p>
          <h1 className="tw-m-0 tw-mt-2 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
            {artwork.title}
          </h1>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {artwork.project}, {artwork.year} · {artwork.objectId}
          </p>
        </div>
        <Link
          href={`/museum/network/projects/${artwork.projectSlug}`}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.objects.viewProject")}
        </Link>
      </header>

      <MuseumArtworkViewer artwork={artwork} />

      <div className="tw-mt-12 tw-grid tw-gap-10 lg:tw-grid-cols-[minmax(0,1fr)_18rem] lg:tw-gap-16">
        <section aria-labelledby="museum-object-reading-title">
          <h2
            id="museum-object-reading-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.reading")}
          </h2>
          {objectDocument ? (
            <MuseumMarkdown
              className="tw-mt-6"
              embeddedDocument
              sourceCommit={publication.identity.commit}
              sourcePath={objectDocument.sourcePath}
            >
              {objectDocument.markdown}
            </MuseumMarkdown>
          ) : (
            <div className="tw-mt-6 tw-border-l-2 tw-border-yellow-400 tw-pl-4 tw-text-sm tw-leading-6 tw-text-yellow-100">
              {t(DEFAULT_LOCALE, "museum.network.objects.readingUnavailable")}
            </div>
          )}
        </section>

        <aside
          aria-labelledby="museum-object-details-title"
          className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6 lg:tw-border-l lg:tw-border-t-0 lg:tw-pl-6 lg:tw-pt-0"
        >
          <h2
            id="museum-object-details-title"
            className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.collectionDetails")}
          </h2>
          <dl className="tw-m-0 tw-mt-5 tw-space-y-5">
            <div>
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(DEFAULT_LOCALE, "museum.network.objects.status")}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                {t(DEFAULT_LOCALE, "museum.network.objects.accessioned")}
              </dd>
            </div>
            <div>
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(DEFAULT_LOCALE, "museum.network.objects.medium")}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                {artwork.medium}
              </dd>
            </div>
            <div>
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(DEFAULT_LOCALE, "museum.network.objects.credit")}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                {artwork.creditLine}{" "}
                {artwork.rightsUrl ? (
                  <a
                    href={artwork.rightsUrl}
                    target="_blank"
                    rel="license noopener noreferrer"
                    className="tw-text-iron-200 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {artwork.rightsLabel}
                  </a>
                ) : (
                  artwork.rightsLabel
                )}
              </dd>
            </div>
          </dl>
          <Link
            href={`/museum/network/gifts/${CASEY_ACCESSION_ID}`}
            className="hover:tw-text-primary-200 tw-mt-6 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.viewGift")}
          </Link>
        </aside>
      </div>

      {objectRecord && (
        <div className="tw-mt-12 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
          <MuseumJsonDisclosure
            label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
            value={{ publication: publication.identity, artwork: objectRecord }}
          />
        </div>
      )}
    </article>
  );
}
