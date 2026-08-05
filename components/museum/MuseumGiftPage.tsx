import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumArtworkFigure } from "./MuseumArtworkFigure";
import { MuseumDossierDocument } from "./MuseumDossierDocument";
import { MuseumMarkdown } from "./MuseumMarkdown";
import { MuseumPublicationUnavailable } from "./MuseumPublicationUnavailable";
import { MuseumSourceMatrixLink } from "./MuseumSourceMatrixLink";
import { MuseumInsideSystemDirectory } from "./MuseumInsideSystem";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CASEY_ACCESSION_ID,
  CASEY_DOSSIER,
  getCaseyDossierAnchor,
  tryCaseyArtworksFromPublication,
  getCaseyPublicationDocument,
  hasCompleteCaseyPublicationDossier,
} from "@/lib/museum/casey";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { CASEY_GENERATIVE_STUDIES } from "@/lib/museum/generative-studies";

export function getMuseumGiftMetadata(accessionId: string): Metadata {
  return getAppMetadata({
    title:
      accessionId === CASEY_ACCESSION_ID
        ? t(DEFAULT_LOCALE, "museum.network.gift.caseyTitle")
        : t(DEFAULT_LOCALE, "museum.network.gift.title"),
    description: t(DEFAULT_LOCALE, "museum.network.gift.caseyDescription"),
  });
}

export async function MuseumGiftPage({
  accessionId,
}: {
  readonly accessionId: string;
}) {
  if (accessionId !== CASEY_ACCESSION_ID) {
    notFound();
  }

  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = publicationState.publication;
  const artworks = tryCaseyArtworksFromPublication(publication);
  if (artworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const gift = publication.gifts.find((item) => item.id === CASEY_ACCESSION_ID);
  if (gift === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const giftNarrative = publication.documents.find(
    (document) =>
      document.kind === "gift_narrative" &&
      document.giftIds.includes(CASEY_ACCESSION_ID)
  );
  const sourceMatrix = publication.documents.find(
    (document) => document.kind === "source_chronology_matrix"
  );
  if (giftNarrative === undefined || sourceMatrix === undefined) {
    return <MuseumPublicationUnavailable />;
  }
  const dossierComplete = hasCompleteCaseyPublicationDossier(publication);
  const supplementaryDocuments = CASEY_DOSSIER;
  const supplementaryDossier = supplementaryDocuments.flatMap((descriptor) => {
    const anchor = getCaseyDossierAnchor(descriptor.path);
    return anchor === null ? [] : [{ descriptor, anchor }];
  });
  if (supplementaryDossier.length !== supplementaryDocuments.length) {
    return <MuseumPublicationUnavailable />;
  }

  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/collection"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.gift.backToCollection")}
      </Link>
      <header className="tw-mt-6 tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_20rem] lg:tw-items-end">
        <div className="tw-max-w-4xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.gift.eyebrow")}
          </p>
          <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
            {giftNarrative.title}
          </h1>
        </div>
        <dl className="tw-m-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5 lg:tw-border-l lg:tw-border-t-0 lg:tw-pl-6 lg:tw-pt-0">
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.gift.accessionNumber")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-font-mono tw-text-sm tw-text-iron-200">
              {CASEY_ACCESSION_ID}
            </dd>
          </div>
          <div className="tw-mt-5">
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.gift.status")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
              {t(DEFAULT_LOCALE, "museum.network.gift.acceptedAccessioned")}
            </dd>
          </div>
          <div className="tw-mt-5">
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.gift.credit")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
              {gift.donorPublicCredit}
            </dd>
          </div>
        </dl>
      </header>

      <section className="tw-mt-12" aria-labelledby="gift-works-title">
        <h2
          id="gift-works-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.gift.sevenWorks")}
        </h2>
        <div className="tw-mt-6 tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {artworks.map((artwork, index) => (
            <MuseumArtworkFigure
              key={artwork.objectId}
              artwork={artwork}
              eager={index < 3}
              href={`/museum/network/collection/${encodeURIComponent(artwork.objectId)}`}
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      </section>

      <section
        className="tw-mt-16 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="gift-systems-title"
      >
        <div className="tw-max-w-4xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.eyebrow")}
          </p>
          <h2
            id="gift-systems-title"
            className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.giftTitle")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.giftDescription")}
          </p>
        </div>
        <div className="tw-mt-8">
          <MuseumInsideSystemDirectory studies={CASEY_GENERATIVE_STUDIES} />
        </div>
      </section>

      <section
        className="tw-mt-16 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="gift-narrative-title"
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.gift.narrative")}
        </p>
        <h2
          id="gift-narrative-title"
          className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.gift.narrativeHeading")}
        </h2>
        <MuseumMarkdown
          className="tw-mt-6"
          embeddedDocument
          sourceCommit={publication.identity.commit}
          sourcePath={giftNarrative.sourcePath}
        >
          {giftNarrative.markdown}
        </MuseumMarkdown>
        <div className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
          <MuseumSourceMatrixLink />
        </div>
      </section>

      <section
        className="tw-mt-16 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="gift-dossier-title"
      >
        <div className="tw-max-w-3xl">
          <h2
            id="gift-dossier-title"
            className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.gift.dossier")}
          </h2>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.gift.dossierDescription")}
          </p>
          {!dossierComplete && (
            <p className="tw-m-0 tw-mt-4 tw-border-l-2 tw-border-yellow-400 tw-pl-4 tw-text-sm tw-leading-6 tw-text-yellow-100">
              {t(DEFAULT_LOCALE, "museum.network.gift.dossierUnavailable")}
            </p>
          )}
        </div>
        <div className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800">
          {supplementaryDossier.map(({ descriptor, anchor }) => {
            const document = getCaseyPublicationDocument(
              publication,
              descriptor.path
            );
            return (
              <MuseumDossierDocument
                key={descriptor.path}
                anchor={anchor}
                summary={
                  <summary className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-py-4 tw-text-base tw-font-semibold tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
                    <span>{descriptor.title}</span>
                    <span className="tw-text-sm tw-font-normal tw-text-iron-500 group-open:tw-text-primary-300">
                      {t(DEFAULT_LOCALE, "museum.network.gift.readDocument")}
                    </span>
                  </summary>
                }
              >
                <div className="tw-max-w-4xl tw-pb-10 tw-pt-2">
                  {document ? (
                    <MuseumMarkdown
                      sourceCommit={publication.identity.commit}
                      sourcePath={document.sourcePath}
                    >
                      {document.markdown}
                    </MuseumMarkdown>
                  ) : (
                    <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-yellow-100">
                      {t(
                        DEFAULT_LOCALE,
                        "museum.network.gift.documentUnavailable"
                      )}
                    </p>
                  )}
                </div>
              </MuseumDossierDocument>
            );
          })}
        </div>
      </section>
    </article>
  );
}
