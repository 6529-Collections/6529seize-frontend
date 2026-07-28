import type { PublicReviewPageDefinition } from "./publicReviewTypes";

function isLowercaseAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "0" && character <= "9")
  );
}

function isCanonicalReviewSlug(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 120 &&
    value
      .split("-")
      .every(
        (segment) =>
          segment.length > 0 &&
          [...segment].every(isLowercaseAsciiLetterOrDigit)
      )
  );
}

export interface PublicReviewRouteBuilder {
  readonly reviewSlug: string;
  readonly getRootHref: (version?: string) => string;
  readonly getPageHref: (
    page: PublicReviewPageDefinition,
    version?: string
  ) => string;
  readonly getFeedbackHref: (version?: string) => string;
}

export function createPublicReviewRouteBuilder(
  reviewSlug: string
): PublicReviewRouteBuilder {
  if (!isCanonicalReviewSlug(reviewSlug)) {
    throw new Error("A public review route requires a canonical review slug.");
  }

  const getRootHref = (version?: string): string =>
    version
      ? `/reviews/${reviewSlug}/versions/${encodeURIComponent(version)}`
      : `/reviews/${reviewSlug}`;

  return {
    reviewSlug,
    getRootHref,
    getPageHref: (page, version) =>
      page.id === "overview"
        ? getRootHref(version)
        : `${getRootHref(version)}/${page.slug}`,
    getFeedbackHref: (version) => `${getRootHref(version)}/feedback`,
  };
}
