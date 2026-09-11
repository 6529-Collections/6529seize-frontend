import "next/dist/compiled/server-only";

export const PUBLIC_REVIEW_DESTINATIONS_ENV =
  "PUBLIC_REVIEW_DISCUSSION_DESTINATIONS" as const;

export function getPublicReviewDestinationsEnv(): string | undefined {
  return process.env[PUBLIC_REVIEW_DESTINATIONS_ENV];
}
