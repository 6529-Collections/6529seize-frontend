import { MuseumRelatedEntities } from "./MuseumRelatedEntities";
import { MUSEUM_PROPOSAL_INTENT_VIEW_BYTES } from "./MuseumProposalImage";
import type { AcquisitionWorkCard } from "./acquisition/MuseumAcquisitionExhibition";
import { MuseumAcquisitionRecordDocuments } from "./acquisition/MuseumAcquisitionRecordDocuments";
import {
  MuseumAcquisitionRecordContext,
  MuseumAcquisitionRecordHeader,
} from "./acquisition/MuseumAcquisitionRecordHeader";
import { MuseumAcquisitionRecordWorkSection } from "./acquisition/MuseumAcquisitionRecordWorkSection";
import { isCuratorialDocument } from "./acquisition/MuseumAcquisitionRecordSections";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumAcquisitionViewModel,
  MuseumEntityContextModel,
} from "@/lib/museum/publication/ia";
import {
  museumWorkHref,
  museumWorkHrefForSourceId,
  museumWorkHrefIndex,
} from "@/lib/museum/publication/routes";
import type {
  MuseumArtwork,
  MuseumMedia,
  MuseumPublication,
} from "@/lib/museum/publication/types";
import type { MuseumProgramMedia, MuseumView } from "@/lib/museum/types";
import { displayMuseumPublicAcquisitionStatus } from "@/lib/museum/presentation";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";

function artworkMedia(artwork: MuseumArtwork): MuseumProgramMedia | undefined {
  const media = selectMuseumStillMedia(artwork.media);
  return media === undefined ? undefined : museumMediaToProgramMedia(media);
}

function museumMediaToProgramMedia(media: MuseumMedia): MuseumProgramMedia {
  return {
    sourceUrl: media.url,
    sourceMimeType: media.mediaType ?? "image/*",
    sourceSha256: media.sha256,
    sourceByteSize: null,
    sourceWidth: media.width,
    sourceHeight: media.height,
    altText: media.altText ?? "",
    altTextStatus:
      media.altText === null ? "unavailable" : "governed_artwork_description",
    variants: (media.variants ?? []).map((variant) => ({
      url: variant.url,
      width: variant.width,
      height: variant.height,
      mimeType: "image/webp" as const,
      sha256: variant.sha256,
      byteSize: variant.byteSize,
    })),
  };
}

function sourceIdentifier(value: string): string {
  const normalized = value.trim().replaceAll("\\", "/").split("#", 1)[0] ?? "";
  const filename = normalized.split("/").at(-1) ?? normalized;
  return filename.replace(/\.json$/iu, "");
}

function selectedProgramMediaForSourceIds(
  sourceIds: readonly string[],
  view: MuseumView | null,
  programIds: readonly string[] = []
): MuseumProgramMedia | undefined {
  if (view === null) return undefined;
  const exactIds = new Set(
    sourceIds.map((value) => value.trim()).filter(Boolean)
  );
  const normalizedIds = new Set(
    sourceIds.map(sourceIdentifier).filter((value) => value.length > 0)
  );
  const programs = view.programs.filter(
    (program) =>
      programIds.length === 0 || programIds.includes(program.programId)
  );
  for (const program of programs) {
    for (const selectedWork of program.selectedWorks) {
      const selectedValues = [
        selectedWork.recordId,
        ...(selectedWork.outcomePath === null
          ? []
          : [selectedWork.outcomePath]),
      ];
      const sourceMatches = selectedValues.some(
        (value) =>
          exactIds.has(value.trim()) ||
          normalizedIds.has(sourceIdentifier(value))
      );
      if (
        sourceMatches &&
        selectedWork.media !== null &&
        selectedWork.media.variants.length > 0
      ) {
        return selectedWork.media;
      }
    }
  }
  return undefined;
}

function decorateAcquisitionWorkCard(
  card: AcquisitionWorkCard,
  acquisition: MuseumAcquisitionViewModel
): AcquisitionWorkCard {
  return {
    ...card,
    status: displayMuseumPublicAcquisitionStatus(acquisition.status),
    ...(acquisition.status ===
    "selected_through_acquisition_program_acquisition_pending"
      ? {
          statusQualifier: t(
            DEFAULT_LOCALE,
            "museum.network.acquisitions.selectedWorkQualifier"
          ),
        }
      : {}),
  };
}

function acquisitionWorkCards(
  publication: MuseumPublication,
  acquisition: MuseumAcquisitionViewModel,
  view: MuseumView | null
): readonly AcquisitionWorkCard[] {
  const records: AcquisitionWorkCard[] = [];
  for (const workId of acquisition.workIds) {
    const publicWorkCard = acquisitionPublicWorkCard(publication, workId, view);
    if (publicWorkCard !== undefined) {
      records.push(decorateAcquisitionWorkCard(publicWorkCard, acquisition));
      continue;
    }

    const artworkCard = acquisitionArtworkCard(publication, workId, view);
    if (artworkCard !== undefined) {
      records.push(decorateAcquisitionWorkCard(artworkCard, acquisition));
      continue;
    }

    const outcomeCard = acquisitionOutcomeCard(publication, workId, view);
    if (outcomeCard !== undefined) {
      records.push(decorateAcquisitionWorkCard(outcomeCard, acquisition));
    }
  }
  return records;
}

function exhibitionWorkCards(
  cards: readonly AcquisitionWorkCard[]
): readonly AcquisitionWorkCard[] {
  if (cards.length < 2) return cards;
  const firstImmediatelyViewableIndex = cards.findIndex((card) => {
    if (card.media !== undefined) return true;
    const sourceByteSize = card.presentationMedia?.sourceByteSize;
    return (
      typeof sourceByteSize === "number" &&
      sourceByteSize < MUSEUM_PROPOSAL_INTENT_VIEW_BYTES
    );
  });
  if (firstImmediatelyViewableIndex <= 0) return cards;
  return [
    cards[firstImmediatelyViewableIndex] as AcquisitionWorkCard,
    ...cards.slice(0, firstImmediatelyViewableIndex),
    ...cards.slice(firstImmediatelyViewableIndex + 1),
  ];
}

function acquisitionPublicWorkCard(
  publication: MuseumPublication,
  workId: string,
  view: MuseumView | null
): AcquisitionWorkCard | undefined {
  const publicWork = publication.works?.find((item) => item.id === workId);
  if (publicWork === undefined) return undefined;
  const artist = publication.artists.find(
    (item) => item.id === publicWork.artistId
  );
  const media = selectMuseumStillMedia(publicWork.media);
  const programMedia =
    media === undefined
      ? selectedProgramMediaForSourceIds(
          [publicWork.id, workId, ...(publicWork.sourceRecordIds ?? [])],
          view,
          publicWork.programIds
        )
      : museumMediaToProgramMedia(media);
  return {
    id: publicWork.id,
    href: museumWorkHref(publicWork.id),
    title: publicWork.title,
    artist: artist?.preferredName ?? publicWork.artistId,
    ...(programMedia === undefined ? {} : { media: programMedia }),
    ...(publicWork.presentationMedia?.[0] === undefined
      ? {}
      : { presentationMedia: publicWork.presentationMedia[0] }),
    ...(publicWork.mediaMetadata?.[0] === undefined
      ? {}
      : { mediaMetadata: publicWork.mediaMetadata[0] }),
  };
}

function acquisitionArtworkCard(
  publication: MuseumPublication,
  workId: string,
  view: MuseumView | null
): AcquisitionWorkCard | undefined {
  const artwork = publication.artworks.find((item) => item.id === workId);
  if (artwork === undefined) return undefined;
  const href = museumWorkHrefForSourceId(publication, artwork.id);
  if (href === null) return undefined;
  const artist = publication.artists.find(
    (item) => item.id === artwork.artistId
  );
  const programMedia =
    artworkMedia(artwork) ??
    selectedProgramMediaForSourceIds([artwork.id, artwork.sourcePath], view);
  return {
    id: artwork.id,
    href,
    title: artwork.title,
    artist: artist?.preferredName ?? artwork.artistId,
    ...(programMedia === undefined ? {} : { media: programMedia }),
  };
}

function acquisitionOutcomeCard(
  publication: MuseumPublication,
  workId: string,
  view: MuseumView | null
): AcquisitionWorkCard | undefined {
  const outcome = view?.objects.find((item) => item.objectId === workId);
  if (outcome === undefined) return undefined;
  const href = museumWorkHrefForSourceId(publication, outcome.objectId, view);
  if (href === null) return undefined;
  const meta =
    outcome.selectionPlace === null
      ? undefined
      : t(DEFAULT_LOCALE, "museum.network.objects.selectionPlace", {
          place: String(outcome.selectionPlace),
        });
  return {
    id: outcome.objectId,
    href,
    title: outcome.title,
    artist: outcome.artist,
    ...(outcome.media === null ? {} : { media: outcome.media }),
    ...(meta === undefined ? {} : { meta }),
  };
}

export function MuseumAcquisitionRecordPage({
  acquisition,
  publication,
  view,
  sourceCommit,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly publication: MuseumPublication;
  readonly view: MuseumView | null;
  readonly sourceCommit: string;
}) {
  const program =
    acquisition.programId === null
      ? null
      : (publication.acquisitionPrograms?.find(
          (item) => item.id === acquisition.programId
        ) ??
        view?.programs.find(
          (item) => item.programId === acquisition.programId
        ) ??
        null);
  const acquisitionDocuments = publication.documents.filter((document) =>
    acquisition.sourceDocumentIds.includes(document.id)
  );
  const workHrefs = museumWorkHrefIndex(publication, view);
  const workCards = acquisitionWorkCards(publication, acquisition, view);
  if (workCards.length !== acquisition.workIds.length) {
    throw new Error(
      `museum_acquisition_work_join_incomplete:${acquisition.acquisitionId}`
    );
  }
  const displayedWorkCards = exhibitionWorkCards(workCards);
  const coveredPresentationIds = new Set(
    workCards.flatMap((work) =>
      work.presentationMedia === undefined ? [] : [work.presentationMedia.id]
    )
  );
  const additionalPresentationMedia = acquisition.presentationMedia.filter(
    (media) => !coveredPresentationIds.has(media.id)
  );
  const artFirst = workCards.length > 0;
  const curatorialDocuments = acquisitionDocuments.filter(isCuratorialDocument);
  const recordDocuments = acquisitionDocuments.filter(
    (document) => !isCuratorialDocument(document)
  );
  const context: MuseumEntityContextModel = {
    ...acquisition,
    status: displayMuseumPublicAcquisitionStatus(acquisition.status),
    breadcrumbs: [
      { label: "6529 Network Museum", href: "/museum/network" },
      {
        label: t(DEFAULT_LOCALE, "museum.network.acquisitions.title"),
        href: "/museum/network/acquisitions",
      },
      { label: acquisition.title },
    ],
  };

  return (
    <article className="tw-min-w-0">
      <MuseumAcquisitionRecordHeader
        acquisition={acquisition}
        context={context}
      />
      <MuseumAcquisitionRecordWorkSection
        workCards={displayedWorkCards}
        additionalPresentationMedia={additionalPresentationMedia}
        artFirst={artFirst}
      />
      <MuseumAcquisitionRecordContext
        context={context}
        artFirst={artFirst}
        curatorialDocumentCount={curatorialDocuments.length}
        workCount={workCards.length}
      />
      <MuseumAcquisitionRecordDocuments
        acquisition={acquisition}
        acquisitionDocuments={acquisitionDocuments}
        curatorialDocuments={curatorialDocuments}
        recordDocuments={recordDocuments}
        context={context}
        program={program}
        publication={publication}
        sourceCommit={sourceCommit}
        workHrefs={workHrefs}
        artFirst={artFirst}
      />

      <MuseumRelatedEntities
        entities={[
          ...acquisition.primaryRelations,
          ...acquisition.secondaryRelations,
        ]}
        headingId="acquisition-related-entities-title"
        title={t(DEFAULT_LOCALE, "museum.network.acquisitions.context")}
      />
    </article>
  );
}
