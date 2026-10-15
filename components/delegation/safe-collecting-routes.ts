import { DelegationCenterSection } from "@/types/enums";

const SECTION_SLUGS: Partial<Record<DelegationCenterSection, string>> = {
  [DelegationCenterSection.CENTER]: "",
  [DelegationCenterSection.WALLET_ARCHITECTURE]: "tap-guide",
  [DelegationCenterSection.FAQ]: "faq",
};

export function getSafeCollectingSectionPath(
  section: DelegationCenterSection
): string {
  const slug = SECTION_SLUGS[section] ?? section;
  return slug ? `/safe-collecting/${slug}` : "/safe-collecting";
}

/** Keep article identifiers independent from their public route names. */
export function normalizeSafeCollectingSegments(
  segments: readonly string[]
): string[] {
  const [first, ...rest] = segments;
  if (first === "tap-guide")
    return [DelegationCenterSection.WALLET_ARCHITECTURE, ...rest];
  if (first === "faq") return [DelegationCenterSection.FAQ, ...rest];
  return [...segments];
}

export function getSafeCollectingArticlePath(
  segments: readonly string[]
): string {
  const [first, ...rest] = normalizeSafeCollectingSegments(segments);
  if (
    first &&
    Object.values(DelegationCenterSection).includes(
      first as DelegationCenterSection
    )
  ) {
    const base = getSafeCollectingSectionPath(first as DelegationCenterSection);
    return rest.length ? `${base}/${rest.join("/")}` : base;
  }
  return `/safe-collecting/${segments.join("/")}`;
}
