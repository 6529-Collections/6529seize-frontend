import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const OG_CACHE_CONTROL =
  "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400";

export const MAX_TEXT_LENGTH = 180;
export const MAX_IMAGE_URL_LENGTH = 8192;

export const getQueryText = (
  searchParams: URLSearchParams,
  key: string
): string | null => {
  const normalized = getUsableText(searchParams.get(key));
  return normalized ? normalized.slice(0, MAX_TEXT_LENGTH) : null;
};

export const getQueryImageUrl = (
  searchParams: URLSearchParams,
  key: string
): string | null => {
  const normalized = getUsableText(searchParams.get(key));
  if (normalized === null || normalized.length > MAX_IMAGE_URL_LENGTH) {
    return null;
  }

  return normalized;
};
