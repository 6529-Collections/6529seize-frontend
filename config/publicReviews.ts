const LOCAL_REVIEW_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const STAGING_REVIEW_HOSTNAMES = new Set(["staging.6529.io"]);

type PublicReviewEnvironment = "local" | "staging" | "disabled";

export function getPublicReviewEnvironment(
  baseEndpoint: string
): PublicReviewEnvironment {
  let hostname: string;

  try {
    hostname = new URL(baseEndpoint).hostname.toLowerCase();
  } catch {
    return "disabled";
  }

  if (LOCAL_REVIEW_HOSTNAMES.has(hostname)) {
    return "local";
  }

  if (STAGING_REVIEW_HOSTNAMES.has(hostname)) {
    return "staging";
  }

  return "disabled";
}

export function isPublicReviewEnabled(baseEndpoint: string): boolean {
  return getPublicReviewEnvironment(baseEndpoint) !== "disabled";
}
