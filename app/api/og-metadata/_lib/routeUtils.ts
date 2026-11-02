export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const OG_CACHE_CONTROL =
  "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400";

// Cards that could not resolve their backend data render a neutral fallback,
// which should be retried soon instead of being cached for the full period.
export const OG_FALLBACK_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=300";
