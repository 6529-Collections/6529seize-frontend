import { STREAM_REVIEW_PRODUCTION_ENABLED } from "@/lib/public-review/streamReviewPublication";

const LOCAL_REVIEW_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const STAGING_REVIEW_HOSTNAMES = new Set(["staging.6529.io"]);
const PRODUCTION_REVIEW_HOSTNAMES = new Set(["6529.io", "www.6529.io"]);

type PublicReviewEnvironment = "local" | "staging" | "production" | "disabled";

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

  if (PRODUCTION_REVIEW_HOSTNAMES.has(hostname)) {
    return STREAM_REVIEW_PRODUCTION_ENABLED ? "production" : "disabled";
  }

  return "disabled";
}

export function isPublicReviewEnabled(baseEndpoint: string): boolean {
  return getPublicReviewEnvironment(baseEndpoint) !== "disabled";
}
