import type { OnchainWorkImage } from "./media";
import type { OnchainMuseumRecord } from "./museum";
import {
  asRecord,
  bodyOf,
  bodyText,
  cleanLabel,
  familyOf,
  identifiersOf,
  museumExt,
} from "./fields";
import type { OnchainMuseumView } from "./presentation";

/**
 * What the pages say about works, artists and the records about them, read
 * from profile fields: `body.created_by`, `body.identifiers`, `body.media`,
 * `body.members`, relations and `about`.
 */

function isEntity(record: OnchainMuseumRecord, kind: string): boolean {
  return familyOf(record) === "PRV_ENTITY" && record.profile?.kind === kind;
}

function unique(
  records: readonly OnchainMuseumRecord[]
): OnchainMuseumRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.subjectId)) return false;
    seen.add(record.subjectId);
    return true;
  });
}

/** Targets of the record's outgoing relations of a kind. */
function relatedOut(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord,
  kind: string
): OnchainMuseumRecord[] {
  return unique(
    view
      .edgesOf(record)
      .filter((edge) => edge.kind === kind && edge.direction === "out")
      .map((edge) => edge.other)
      .filter((item): item is OnchainMuseumRecord => item !== null)
  );
}

/** Sources of the record's incoming relations of a kind. */
function relatedIn(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord,
  kind: string
): OnchainMuseumRecord[] {
  return unique(
    view
      .edgesOf(record)
      .filter((edge) => edge.kind === kind && edge.direction === "in")
      .map((edge) => edge.other)
      .filter((item): item is OnchainMuseumRecord => item !== null)
  );
}

/** A work's creators: `body.created_by`, else its `created_by` relations. */
export function creatorsOf(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainMuseumRecord[] {
  const createdBy = bodyOf(record)["created_by"];
  const embedded = (Array.isArray(createdBy) ? createdBy : [])
    .map((item) => view.recordForRef(asRecord(item)?.["agent"]))
    .filter((item): item is OnchainMuseumRecord => item !== null);
  return embedded.length > 0
    ? unique(embedded)
    : relatedOut(view, record, "created_by");
}

/** The objects a work is: entities of kind `object` with its accession number. */
function objectsOfWork(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainMuseumRecord[] {
  const numbers = identifiersOf(record, "accession_number");
  if (numbers.length === 0) return [];
  return view.snapshot.records.filter(
    (item) =>
      isEntity(item, "object") &&
      identifiersOf(item, "accession_number").some((value) =>
        numbers.includes(value)
      )
  );
}

/** The work an object or a work entity stands for. */
export function workForEntity(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainMuseumRecord | null {
  if (isEntity(record, "work")) return record;
  if (!isEntity(record, "object")) return null;
  const numbers = identifiersOf(record, "accession_number");
  return (
    view.snapshot.records.find(
      (item) =>
        isEntity(item, "work") &&
        identifiersOf(item, "accession_number").some((value) =>
          numbers.includes(value)
        )
    ) ?? null
  );
}

/**
 * Where a work stands: in the collection when it is `member_of` a collection
 * that is `held_by` someone, with that collection.
 */
export function collectionOf(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainMuseumRecord | null {
  return (
    relatedOut(view, record, "member_of").find(
      (target) => view.groupKeyOf(target) === "collection"
    ) ?? null
  );
}

/** Sets, programs and projects a work is a member of, by index group. */
export function memberships(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord,
  groupKey: string
): OnchainMuseumRecord[] {
  const viaRelations = relatedOut(view, record, "member_of");
  const viaSets = view.snapshot.records.filter((item) => {
    const members = bodyOf(item)["members"];
    return (
      Array.isArray(members) &&
      members.some(
        (member) =>
          view.recordForRef(asRecord(member)?.["ref"] ?? member)?.subjectId ===
          record.subjectId
      )
    );
  });
  return unique([...viaRelations, ...viaSets]).filter(
    (item) => view.groupKeyOf(item) === groupKey
  );
}

/** The medium the Museum records for a work, a display detail in `ext`. */
export function mediumOf(record: OnchainMuseumRecord): string | null {
  const medium = asRecord(museumExt(record)?.["profile"])?.["medium"];
  return typeof medium === "string" && medium.trim() !== "" ? medium : null;
}

/** A work whose medium the Museum describes as generative software. */
export function isGenerative(record: OnchainMuseumRecord): boolean {
  return /generative/iu.test(mediumOf(record) ?? "");
}

/** Records about a work and its objects that are not entities or texts. */
export function objectRecordsOf(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainMuseumRecord[] {
  const objects = objectsOfWork(view, record);
  const about = [record, ...objects]
    .flatMap((item) => view.recordsAbout(item))
    .filter((item) => {
      const family = familyOf(item);
      return family !== "PRV_DOCUMENT" && family !== "PRV_ENTITY";
    });
  return unique([...objects, ...about]);
}

export interface OnchainRightsView {
  readonly record: OnchainMuseumRecord;
  readonly status: string | null;
  readonly licence: string | null;
  readonly licenceUri: string | null;
}

/** The PRV_RIGHTS records about a work or one of its objects. */
export function rightsOf(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainRightsView[] {
  return objectRecordsOf(view, record)
    .filter((item) => familyOf(item) === "PRV_RIGHTS")
    .map((item) => {
      const body = bodyOf(item);
      const licence = asRecord(body["licence"]);
      return {
        record: item,
        status: typeof body["status"] === "string" ? body["status"] : null,
        licence: typeof licence?.["name"] === "string" ? licence["name"] : null,
        licenceUri:
          typeof licence?.["uri"] === "string" &&
          licence["uri"].startsWith("https://")
            ? licence["uri"]
            : null,
      };
    });
}

export interface OnchainWorkImageView {
  readonly image: OnchainWorkImage;
  /**
   * The credit as the Museum records it: the object's credit line, else the
   * media record's own credit. Null when the only credit is a working label
   * for a Museum-made derivative; build one from the parts.
   */
  readonly recordedCredit: string | null;
  readonly artists: readonly string[];
  readonly title: string;
  /** The acquisition or program the work was selected through, if any. */
  readonly program: string | null;
  readonly rights: readonly OnchainRightsView[];
}

/** SHA-256 digests (bare hex) of the files a digital object's `body.media` names. */
function mediaDigests(record: OnchainMuseumRecord): string[] {
  const media = bodyOf(record)["media"];
  return (Array.isArray(media) ? media : [])
    .map((item) => asRecord(asRecord(item)?.["content"])?.["sha256"])
    .filter((digest): digest is string => typeof digest === "string")
    .map((digest) => digest.replace(/^0x/u, "").toLowerCase());
}

/** Digital objects that document a record. */
function documentingMedia(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainMuseumRecord[] {
  return relatedIn(view, record, "documents").filter((item) =>
    isEntity(item, "digital_object")
  );
}

/**
 * A work's verified presentation image: the manifest item keyed by the
 * work's local ID, else the item whose derivative is a file one of the
 * work's digital objects names in `body.media`.
 */
function findImage(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord,
  media: readonly OnchainMuseumRecord[]
): OnchainWorkImage | null {
  const { images } = view.snapshot.media;
  const localId = record.profile?.localId;
  const keyed = localId === undefined ? undefined : images[localId];
  if (keyed !== undefined) return keyed;
  const digests = new Set(media.flatMap(mediaDigests));
  if (digests.size === 0) return null;
  return (
    Object.values(images).find((image) =>
      image.derivatives.some((derivative) => digests.has(derivative.sha256))
    ) ?? null
  );
}

/** The media record's credit, unless it labels a Museum-made derivative. */
function mediaCredit(media: readonly OnchainMuseumRecord[]): string | null {
  for (const item of media) {
    const profile = asRecord(asRecord(museumExt(item)?.["profile"])?.["media"]);
    const credit = profile?.["credit"];
    if (
      profile?.["media_role"] !== "museum_generated_public_derivative" &&
      typeof credit === "string" &&
      credit.trim() !== ""
    ) {
      return credit;
    }
  }
  return null;
}

/** The credit line the Museum records for a work's object, if any. */
export function creditLineOf(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): string | null {
  const targets = isEntity(record, "object")
    ? [record]
    : objectsOfWork(view, record);
  for (const object of targets) {
    const credit = museumExt(object)?.["credit_line"];
    if (typeof credit === "string" && credit.trim() !== "") return credit;
  }
  return null;
}

export function workImage(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainWorkImageView | null {
  if (!isEntity(record, "work")) return null;
  const media = documentingMedia(view, record);
  const image = findImage(view, record, media);
  if (image === null) return null;
  const program = [
    ...memberships(view, record, "acquisition"),
    ...memberships(view, record, "program"),
  ][0];
  return {
    image,
    recordedCredit: creditLineOf(view, record) ?? mediaCredit(media),
    artists: creatorsOf(view, record).map((item) => view.labelOf(item)),
    title: cleanLabel(bodyText(record, "label") ?? record.label),
    program: program === undefined ? null : view.labelOf(program),
    rights: rightsOf(view, record),
  };
}

/** Works a document is about: named works, objects, or a small set's members. */
export function worksAbout(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainMuseumRecord[] {
  const works: OnchainMuseumRecord[] = [];
  for (const item of view.aboutOf(record)) {
    const direct = workForEntity(view, item);
    if (direct !== null) {
      works.push(direct);
      continue;
    }
    const members = bodyOf(item)["members"];
    if (!Array.isArray(members) || members.length > 3) continue;
    for (const member of members) {
      const entity = view.recordForRef(asRecord(member)?.["ref"] ?? member);
      const work = entity === null ? null : workForEntity(view, entity);
      if (work !== null) works.push(work);
    }
  }
  return unique(works);
}
