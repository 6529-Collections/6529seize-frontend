/** Static profile routes remain application pages, never CMS page slugs. */
export const CMS_RESERVED_PROFILE_SEGMENTS = [
  "brain",
  "cms",
  "collected",
  "curations",
  "followers",
  "groups",
  "identity",
  "proxy",
  "subscriptions",
  "waves",
  "xtdh",
] as const;

export function isReservedCmsProfileSegment(segment: string): boolean {
  return (CMS_RESERVED_PROFILE_SEGMENTS as readonly string[]).includes(
    segment.toLowerCase()
  );
}

/** Authoring accepts one readable segment; titles remain independent. */
export function isValidCmsPageSlug(slug: string): boolean {
  return (
    slug.length <= 80 &&
    slug.split("-").every((part) => /^[a-z0-9]+$/.test(part)) &&
    !isReservedCmsProfileSegment(slug)
  );
}
