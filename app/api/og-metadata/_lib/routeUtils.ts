import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const OG_CACHE_CONTROL =
  "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400";

export const MAX_TEXT_LENGTH = 180;

export const getQueryText = (
  searchParams: URLSearchParams,
  key: string
): string | null => {
  const normalized = getUsableText(searchParams.get(key));
  return normalized ? normalized.slice(0, MAX_TEXT_LENGTH) : null;
};
