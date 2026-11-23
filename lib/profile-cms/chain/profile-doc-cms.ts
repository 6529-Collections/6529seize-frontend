/**
 * The profile site in a person's ProfileDoc (ProfileDoc.v1).
 * A document's fields are string keys with string values, so the site is
 * three flat keys, each a raw sha2-256 CID in base32:
 *
 *   cms.primary.publication  the signed publication record
 *   cms.primary.package      the content core it signs
 *   cms.archive              the 6529.io site history (set by the import)
 *
 * The site builder changes only the two `cms.primary.*` keys, together.
 * Every other field, `cms.archive` included, is copied as it is.
 */
const PROFILE_DOC_CMS_KEYS = {
  publication: "cms.primary.publication",
  package: "cms.primary.package",
  archive: "cms.archive",
} as const;

export type ProfileSitePointer = {
  readonly publication: string;
  readonly package: string;
};

/** The next document's fields: `fields` with the site pointer set, or removed for null. */
export function withProfileSitePointer(
  fields: ReadonlyMap<string, string> | null,
  pointer: ProfileSitePointer | null
): Map<string, string> {
  const next = new Map(fields ?? []);
  if (pointer) {
    next.set(PROFILE_DOC_CMS_KEYS.publication, pointer.publication);
    next.set(PROFILE_DOC_CMS_KEYS.package, pointer.package);
  } else {
    next.delete(PROFILE_DOC_CMS_KEYS.publication);
    next.delete(PROFILE_DOC_CMS_KEYS.package);
  }
  return next;
}
