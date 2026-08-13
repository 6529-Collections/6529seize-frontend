import type {
  MuseumAcquisitionViewModel,
  MuseumBreadcrumbItem,
  MuseumEntityContextModel,
  MuseumEntityRef,
  MuseumEntityRefMedia,
  MuseumEntityRelations,
  MuseumPublicAcquisitionStatus,
} from "./ia";
import type {
  MuseumArtwork,
  MuseumCuratedAcquisition,
  MuseumGift,
  MuseumMedia,
  MuseumPublicWork,
  MuseumPublication,
} from "./types";
import {
  museumPublicAcquisitionStatus,
  museumPublicWorkStatus,
} from "./collectionSemantics";
import { selectMuseumStillMedia } from "./mediaSelection";
import type { MuseumSelectedWork, MuseumView } from "@/lib/museum/types";
import {
  MUSEUM_CASEY_ACQUISITION_ID,
  MUSEUM_CASEY_ACQUISITION_SLUG,
  MUSEUM_KEYS_AND_GATES_ACQUISITION_ID,
  MUSEUM_KEYS_AND_GATES_ACQUISITION_SLUG,
  museumAcquisitionHref,
  museumAcquisitionProgramHref,
  museumArtistHref,
  museumOrganizationHref,
  museumProjectHref,
  museumWorkHref,
  museumWorkHrefForSourceId,
  resolveMuseumAcquisitionProgramSlug,
} from "./routes";

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function firstPath(paths: readonly string[]): string | null {
  return paths.find((path) => path.trim().length > 0) ?? null;
}

export function dedupe(
  refs: readonly (MuseumEntityRef | null)[]
): readonly MuseumEntityRef[] {
  const seen = new Set<string>();
  return refs.flatMap((item) => {
    if (item === null) return [];
    const key = `${item.kind}:${item.id}:${item.href}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [item];
  });
}

function statusTone(
  status?: string
): "neutral" | "success" | "warning" | "danger" {
  const normalized = status?.toLocaleLowerCase() ?? "";
  if (
    status === "accessioned_into_permanent_collection" ||
    normalized.includes("accessioned into the permanent collection")
  ) {
    return "success";
  }
  if (status === "closed_without_selection" || status === "withdrawn")
    return "neutral";
  return "warning";
}

const PUBLIC_ACQUISITION_STATUSES: ReadonlySet<string> = new Set([
  "proposed_in_museum_wave",
  "selected_by_museum_wave_acquisition_review_in_progress",
  "selected_through_acquisition_program_acquisition_pending",
  "acquisition_complete_accession_review_in_progress",
  "accessioned_into_permanent_collection",
  "closed_without_selection",
  "withdrawn",
]);

const PROGRAM_SELECTION_RELATION = "Selected through";
const PROGRAM_SELECTION_STATUS =
  "selected_through_acquisition_program_acquisition_pending";
const GIFT_PATHWAY_RELATION = "Gift pathway";

function isGiftAcquisitionMethod(method: string): boolean {
  return method === "gift" || method === "donation";
}

function isPublicAcquisitionStatus(
  status: string
): status is MuseumPublicAcquisitionStatus {
  return PUBLIC_ACQUISITION_STATUSES.has(status);
}

function context(input: {
  readonly kind: MuseumEntityContextModel["kind"];
  readonly id: string;
  readonly label: string;
  readonly canonicalHref: string;
  readonly breadcrumbs: readonly MuseumBreadcrumbItem[];
  readonly status?: string;
  readonly statusAsOf?: string | null;
  readonly primaryRelations?: readonly MuseumEntityRef[];
  readonly secondaryRelations?: readonly MuseumEntityRef[];
  readonly sourcePath: string | null;
  readonly sourceCommit: string | null;
}): MuseumEntityContextModel {
  return {
    kind: input.kind,
    id: input.id,
    label: input.label,
    canonicalHref: input.canonicalHref,
    breadcrumbs: input.breadcrumbs,
    ...(input.status === undefined
      ? {}
      : { status: input.status, statusTone: statusTone(input.status) }),
    statusAsOf: input.statusAsOf ?? null,
    primaryRelations: input.primaryRelations ?? [],
    secondaryRelations: input.secondaryRelations ?? [],
    sourcePath: input.sourcePath,
    sourceCommit: input.sourceCommit,
  };
}

function ref(input: {
  readonly kind: MuseumEntityRef["kind"];
  readonly id: string;
  readonly label: string;
  readonly href: string | null;
  readonly relation: string;
  readonly status?: string;
  readonly statusAsOf?: string | null;
  readonly sourcePath?: string | null;
  readonly sourceCommit?: string | null;
  readonly media?: MuseumEntityRefMedia;
}): MuseumEntityRef | null {
  if (
    input.href === null ||
    input.href.trim().length === 0 ||
    input.id.trim().length === 0
  ) {
    return null;
  }
  return {
    kind: input.kind,
    id: input.id,
    label: input.label,
    href: input.href,
    relation: input.relation,
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.statusAsOf === undefined ? {} : { statusAsOf: input.statusAsOf }),
    ...(input.sourcePath?.trim() ? { sourcePath: input.sourcePath } : {}),
    ...(input.sourceCommit?.trim() ? { sourceCommit: input.sourceCommit } : {}),
    ...(input.media === undefined ? {} : { media: input.media }),
  };
}

function legacyStatus(artwork: MuseumArtwork): MuseumPublicAcquisitionStatus {
  return artwork.institutionalStatus === "accessioned"
    ? "accessioned_into_permanent_collection"
    : "selected_through_acquisition_program_acquisition_pending";
}

function artworkLabel(artwork: MuseumArtwork): string {
  return artwork.title.trim() || artwork.id;
}

function selectedWorkLabel(work: MuseumSelectedWork): string {
  return work.title.trim() || work.recordId;
}

function artistForSourceValue(
  publication: MuseumPublication,
  value: string
): MuseumPublication["artists"][number] | undefined {
  const normalized = value.trim().toLocaleLowerCase();
  return publication.artists.find(
    (artist) =>
      artist.id === value ||
      artist.slug.toLocaleLowerCase() === normalized ||
      artist.preferredName.toLocaleLowerCase() === normalized
  );
}

function artworkMedia(
  artwork: MuseumArtwork
): MuseumEntityRefMedia | undefined {
  const media: MuseumMedia | undefined = selectMuseumStillMedia(artwork.media);
  if (media === undefined) return undefined;
  return {
    kind: "governed",
    src: media.url,
    width: media.width,
    height: media.height,
    alt: media.altText ?? "",
    creditLine: media.credit.creditLine,
  };
}

function publicWorkMedia(
  work: MuseumPublicWork
): MuseumEntityRefMedia | undefined {
  const retained = selectMuseumStillMedia(work.media);
  if (retained !== undefined) {
    return {
      kind: "governed",
      src: retained.url,
      width: retained.width,
      height: retained.height,
      alt: retained.altText ?? "",
      creditLine: retained.credit.creditLine,
    };
  }
  const proposal = work.presentationMedia?.[0];
  return proposal === undefined
    ? undefined
    : {
        kind: "external_proposal",
        src: proposal.mediaUrl,
        width: proposal.width,
        height: proposal.height,
        alt: proposal.altText,
        creditLine: proposal.credit.creditLine,
      };
}

function artworkById(
  publication: MuseumPublication,
  ids: readonly string[]
): readonly MuseumArtwork[] {
  const byId = new Map(publication.artworks.map((item) => [item.id, item]));
  return ids.flatMap((id) => {
    const artwork = byId.get(id);
    return artwork === undefined ? [] : [artwork];
  });
}

function workRef(
  work: MuseumPublicWork,
  sourceCommit: string,
  relation: string
): MuseumEntityRef | null {
  const media = publicWorkMedia(work);
  return ref({
    kind: "work",
    id: work.id,
    label: work.title.trim() || work.id,
    href: museumWorkHref(work.id),
    relation,
    status: museumPublicWorkStatus(work),
    statusAsOf: work.statusAsOf,
    sourcePath: firstPath(work.sourcePaths),
    sourceCommit,
    ...(media === undefined ? {} : { media }),
  });
}

function artworkRef(
  artwork: MuseumArtwork,
  publication: MuseumPublication,
  sourceCommit: string,
  relation: string
): MuseumEntityRef | null {
  const media = artworkMedia(artwork);
  return ref({
    kind: "work",
    id: artwork.id,
    label: artworkLabel(artwork),
    href: museumWorkHrefForSourceId(publication, artwork.id),
    relation,
    status: legacyStatus(artwork),
    sourcePath: artwork.sourcePath,
    sourceCommit,
    ...(media === undefined ? {} : { media }),
  });
}

export function artistRef(
  id: string,
  publication: MuseumPublication,
  relation = "By"
): MuseumEntityRef | null {
  const artist = publication.artists.find((item) => item.id === id);
  if (artist === undefined) return null;
  return ref({
    kind: "artist",
    id: artist.id,
    label: artist.preferredName || artist.id,
    href: museumArtistHref(artist.slug),
    relation,
    sourcePath: firstPath(artist.sourcePaths),
    sourceCommit: publication.identity.commit,
  });
}

export function projectRef(
  id: string,
  publication: MuseumPublication,
  relation = "Part of"
): MuseumEntityRef | null {
  const project = publication.projects.find((item) => item.id === id);
  if (project === undefined) return null;
  return ref({
    kind: "project",
    id: project.id,
    label: project.title || project.id,
    href: museumProjectHref(project.slug),
    relation,
    sourcePath: firstPath(project.sourcePaths),
    sourceCommit: publication.identity.commit,
  });
}

export function acquisitionRef(
  acquisition: MuseumAcquisitionViewModel,
  relation: string
): MuseumEntityRef | null {
  return ref({
    kind: "curated_acquisition",
    id: acquisition.acquisitionId,
    label: acquisition.title,
    href: museumAcquisitionHref(acquisition.slug),
    relation,
    status: acquisition.status,
    statusAsOf: acquisition.statusAsOf,
    sourcePath: acquisition.sourcePath,
    sourceCommit: acquisition.sourceCommit,
  });
}

export function programRef(
  publication: MuseumPublication,
  programId: string,
  label: string,
  statusAsOf: string | null,
  sourcePath: string | null,
  relation = PROGRAM_SELECTION_RELATION,
  status: string | null = PROGRAM_SELECTION_STATUS
): MuseumEntityRef | null {
  const slug = resolveMuseumAcquisitionProgramSlug(publication, programId);
  return ref({
    kind: "acquisition_program",
    id: programId,
    label,
    href: slug === null ? null : museumAcquisitionProgramHref(slug),
    relation,
    ...(status === null ? {} : { status }),
    statusAsOf,
    sourcePath,
    sourceCommit: publication.identity.commit,
  });
}

export function typedProgramRef(
  publication: MuseumPublication,
  programId: string,
  relation = PROGRAM_SELECTION_RELATION
): MuseumEntityRef | null {
  const program = publication.acquisitionPrograms?.find(
    (item) => item.id === programId
  );
  if (program === undefined) return null;
  return ref({
    kind: "acquisition_program",
    id: program.id,
    label: program.title,
    href: museumAcquisitionProgramHref(program.slug),
    relation,
    status: program.status,
    sourcePath: firstPath(program.sourcePaths),
    sourceCommit: publication.identity.commit,
  });
}

function acquisitionRelations(
  acquisition: MuseumAcquisitionViewModel,
  publication: MuseumPublication
): MuseumEntityRelations {
  const typedWorks = acquisition.workIds
    .map((id) => publication.works?.find((work) => work.id === id))
    .flatMap((work) =>
      work === undefined
        ? []
        : [workRef(work, publication.identity.commit, "Part of")]
    );
  const legacyWorks = acquisition.workIds
    .map((id) => publication.artworks.find((artwork) => artwork.id === id))
    .flatMap((artwork) =>
      artwork === undefined
        ? []
        : [
            artworkRef(
              artwork,
              publication,
              publication.identity.commit,
              "Part of"
            ),
          ]
    );
  const artistRefs = acquisition.artistIds.map((id) =>
    artistRef(id, publication)
  );
  const organizationRefs = acquisition.organizationIds.map((id) => {
    const organization = publication.organizations?.find(
      (item) => item.id === id
    );
    return organization === undefined
      ? null
      : ref({
          kind: "organization",
          id: organization.id,
          label: organization.preferredName,
          href: museumOrganizationHref(organization.slug),
          relation: "Associated organization",
          sourcePath: firstPath(organization.sourcePaths),
          sourceCommit: publication.identity.commit,
        });
  });
  const giftPathway = isGiftAcquisitionMethod(acquisition.acquisitionMethod);
  const programRelation = giftPathway
    ? GIFT_PATHWAY_RELATION
    : PROGRAM_SELECTION_RELATION;
  const programStatus = giftPathway ? null : PROGRAM_SELECTION_STATUS;
  const program =
    acquisition.programId === null
      ? null
      : programRef(
          publication,
          acquisition.programId,
          acquisition.pathway ?? acquisition.programId,
          acquisition.statusAsOf,
          acquisition.sourcePath,
          programRelation,
          programStatus
        );
  return {
    primaryRelations: dedupe([...typedWorks, ...legacyWorks, ...artistRefs]),
    secondaryRelations: dedupe([
      program,
      ...acquisition.projectIds.map((id) => projectRef(id, publication)),
      ...organizationRefs,
    ]),
  };
}

function typedAcquisitionRelations(
  acquisition: MuseumCuratedAcquisition,
  publication: MuseumPublication
): MuseumEntityRelations {
  const workRefs = acquisition.workIds.flatMap((id) => {
    const work = publication.works?.find((item) => item.id === id);
    return work === undefined
      ? []
      : [workRef(work, publication.identity.commit, "Part of")];
  });
  const artistRefs = acquisition.artistIds.map((id) =>
    artistRef(id, publication)
  );
  const organizationRefs = acquisition.organizationIds.map((id) => {
    const organization = publication.organizations?.find(
      (item) => item.id === id
    );
    return organization === undefined
      ? null
      : ref({
          kind: "organization",
          id: organization.id,
          label: organization.preferredName,
          href: museumOrganizationHref(organization.slug),
          relation: "Project originator",
          sourcePath: firstPath(organization.sourcePaths),
          sourceCommit: publication.identity.commit,
        });
  });
  const programRelation = isGiftAcquisitionMethod(acquisition.acquisitionMethod)
    ? GIFT_PATHWAY_RELATION
    : PROGRAM_SELECTION_RELATION;
  const programRefs =
    acquisition.programId === null
      ? []
      : [typedProgramRef(publication, acquisition.programId, programRelation)];
  const projectRefs = acquisition.projectIds.map((id) =>
    projectRef(id, publication)
  );
  return {
    primaryRelations: dedupe([...workRefs, ...artistRefs]),
    secondaryRelations: dedupe([
      ...programRefs,
      ...projectRefs,
      ...organizationRefs,
    ]),
  };
}

function modelFromTypedAcquisition(
  acquisition: MuseumCuratedAcquisition,
  publication: MuseumPublication
): MuseumAcquisitionViewModel | null {
  if (
    !acquisition.id.trim() ||
    !acquisition.slug.trim() ||
    !acquisition.title.trim() ||
    !acquisition.thesis.trim() ||
    !acquisition.statusAsOf.trim() ||
    acquisition.workIds.length === 0 ||
    acquisition.sourcePaths.length === 0
  )
    return null;
  if (!isPublicAcquisitionStatus(acquisition.status)) return null;
  const status = museumPublicAcquisitionStatus(acquisition);
  const relations = typedAcquisitionRelations(acquisition, publication);
  const modelContext = context({
    kind: "curated_acquisition",
    id: acquisition.id,
    label: acquisition.title,
    canonicalHref: museumAcquisitionHref(acquisition.slug),
    breadcrumbs: [],
    status,
    statusAsOf: acquisition.statusAsOf,
    primaryRelations: relations.primaryRelations,
    secondaryRelations: relations.secondaryRelations,
    sourcePath: firstPath(acquisition.sourcePaths),
    sourceCommit: publication.identity.commit,
  });
  return {
    ...modelContext,
    kind: "curated_acquisition",
    acquisitionId: acquisition.id,
    slug: acquisition.slug,
    title: acquisition.title,
    thesis: acquisition.thesis,
    status,
    acquisitionMethod: acquisition.acquisitionMethod,
    programId: acquisition.programId,
    pathway: acquisition.programId,
    artistIds: unique(acquisition.artistIds),
    organizationIds: unique(acquisition.organizationIds),
    projectIds: unique(acquisition.projectIds),
    workIds: unique(acquisition.workIds),
    accessionLotIds: unique(acquisition.accessionLotIds),
    sourceDocumentIds: unique(acquisition.sourceDocumentIds),
    sourcePaths: unique(acquisition.sourcePaths),
    presentationMedia: acquisition.presentationMedia ?? [],
  };
}

function caseyAcquisition(
  publication: MuseumPublication
): MuseumAcquisitionViewModel | null {
  const gift: MuseumGift | undefined = publication.gifts.find(
    (item) => item.artworkIds.length > 0
  );
  if (gift === undefined || gift.artworkIds.length === 0) return null;
  const works = artworkById(publication, gift.artworkIds);
  if (!works.every((artwork) => artwork.institutionalStatus === "accessioned"))
    return null;
  const title =
    publication.documents
      .find(
        (document) =>
          document.kind === "gift_narrative" &&
          document.giftIds.includes(gift.id)
      )
      ?.title.trim() ?? "The System in Seven States";
  const modelContext = context({
    kind: "curated_acquisition",
    id: MUSEUM_CASEY_ACQUISITION_ID,
    label: title,
    canonicalHref: museumAcquisitionHref(MUSEUM_CASEY_ACQUISITION_SLUG),
    breadcrumbs: [],
    status: "accessioned_into_permanent_collection",
    statusAsOf: gift.acceptedAt,
    sourcePath: gift.sourcePath,
    sourceCommit: publication.identity.commit,
  });
  const model: MuseumAcquisitionViewModel = {
    ...modelContext,
    kind: "curated_acquisition",
    acquisitionId: MUSEUM_CASEY_ACQUISITION_ID,
    slug: MUSEUM_CASEY_ACQUISITION_SLUG,
    title,
    thesis:
      "A seven-work Casey Reas gift considered together as a public encounter with executable systems and their changing states.",
    status: "accessioned_into_permanent_collection",
    acquisitionMethod: gift.acquisitionMethod,
    programId: null,
    pathway: "Gift Acquisitions",
    artistIds: unique(works.map((work) => work.artistId)),
    organizationIds: [],
    projectIds: unique(works.map((work) => work.projectId)),
    workIds: unique(gift.artworkIds),
    accessionLotIds: [gift.accessionLotId],
    sourceDocumentIds: unique(gift.documentIds),
    sourcePaths: unique([
      gift.sourcePath,
      ...gift.documentIds.flatMap((id) => {
        const document = publication.documents.find((item) => item.id === id);
        return document === undefined ? [] : [document.sourcePath];
      }),
    ]),
    presentationMedia: [],
  };
  const relations = acquisitionRelations(model, publication);
  return {
    ...model,
    primaryRelations: relations.primaryRelations,
    secondaryRelations: relations.secondaryRelations,
  };
}

function keysAndGatesAcquisition(
  publication: MuseumPublication,
  view: MuseumView | null
): MuseumAcquisitionViewModel | null {
  const program = view?.programs.find(
    (item) => item.programId === "6529NM-AP-01"
  );
  if (program === undefined) return null;
  const selectedIds = unique(
    program.selectedWorks.map((work) => work.recordId)
  );
  const objects = selectedIds.flatMap((id) => {
    const object = view?.objects.find((item) => item.objectId === id);
    return object === undefined ? [] : [object];
  });
  const artists = objects.flatMap((object) => {
    const artist = artistForSourceValue(publication, object.artist);
    return artist === undefined ? [] : [artist];
  });
  const modelContext = context({
    kind: "curated_acquisition",
    id: MUSEUM_KEYS_AND_GATES_ACQUISITION_ID,
    label: "Keys and Gates",
    canonicalHref: museumAcquisitionHref(
      MUSEUM_KEYS_AND_GATES_ACQUISITION_SLUG
    ),
    breadcrumbs: [],
    status: "selected_through_acquisition_program_acquisition_pending",
    statusAsOf: program.statusAsOf,
    sourcePath: program.sourcePath,
    sourceCommit: publication.identity.commit,
  });
  const model: MuseumAcquisitionViewModel = {
    ...modelContext,
    kind: "curated_acquisition",
    acquisitionId: MUSEUM_KEYS_AND_GATES_ACQUISITION_ID,
    slug: MUSEUM_KEYS_AND_GATES_ACQUISITION_SLUG,
    title: "Keys and Gates",
    thesis:
      "A coherent photographic group selected through the Keys and Gates program.",
    status: "selected_through_acquisition_program_acquisition_pending",
    acquisitionMethod: "purchase",
    programId: program.programId,
    pathway: program.title,
    artistIds: unique(artists.map((artist) => artist.id)),
    organizationIds: [],
    projectIds: [],
    workIds: selectedIds,
    accessionLotIds: [],
    sourceDocumentIds: [],
    sourcePaths: unique([
      program.sourcePath,
      program.selectedWorksPath ?? "",
      ...program.selectedWorks.map((work) => work.outcomePath ?? ""),
    ]),
    presentationMedia: [],
  };
  const workRefs = program.selectedWorks.map((work) =>
    ref({
      kind: "work",
      id: work.recordId,
      label: selectedWorkLabel(work),
      href: museumWorkHrefForSourceId(publication, work.recordId, view),
      relation: "Part of",
      status: model.status,
      statusAsOf: program.statusAsOf,
      sourcePath: work.outcomePath ?? program.selectedWorksPath,
      sourceCommit: publication.identity.commit,
    })
  );
  return {
    ...model,
    primaryRelations: dedupe([
      programRef(
        publication,
        program.programId,
        program.title || program.programId,
        program.statusAsOf,
        program.sourcePath
      ),
      ...workRefs,
    ]),
    secondaryRelations: dedupe(
      artists.map((artist) =>
        ref({
          kind: "artist",
          id: artist.id,
          label: artist.preferredName,
          href: museumArtistHref(artist.slug),
          relation: "By",
          sourcePath: firstPath(artist.sourcePaths),
          sourceCommit: publication.identity.commit,
        })
      )
    ),
  };
}

export function buildMuseumAcquisitionIndex(
  publication: MuseumPublication,
  view: MuseumView | null
): readonly MuseumAcquisitionViewModel[] {
  if (publication.curatedAcquisitions !== undefined) {
    const typed = publication.curatedAcquisitions.map((acquisition) =>
      modelFromTypedAcquisition(acquisition, publication)
    );
    return typed.some((model) => model === null)
      ? []
      : typed.filter(
          (model): model is MuseumAcquisitionViewModel => model !== null
        );
  }
  return [
    caseyAcquisition(publication),
    keysAndGatesAcquisition(publication, view),
  ].flatMap((model) => (model === null ? [] : [model]));
}

export function buildMuseumAcquisitionContext(
  publication: MuseumPublication,
  slug: string,
  view: MuseumView | null,
  breadcrumbs: readonly MuseumBreadcrumbItem[] = []
): MuseumAcquisitionViewModel | null {
  const acquisition = buildMuseumAcquisitionIndex(publication, view).find(
    (item) => item.slug === slug
  );
  return acquisition === undefined ? null : { ...acquisition, breadcrumbs };
}
