const BANNER_IMAGE_PREFIXES = ["http://", "https://", "ipfs://"];

export const isBannerImageUrl = (value?: string | null): value is string => {
  if (!value) {
    return false;
  }

  return BANNER_IMAGE_PREFIXES.some((prefix) =>
    value.toLowerCase().startsWith(prefix)
  );
};

export const getBannerImageUrl = (value?: string | null): string | null =>
  isBannerImageUrl(value) ? value : null;

export const getBannerColorValue = (
  value?: string | null
): string | null => {
  if (!value) {
    return null;
  }

  return isBannerImageUrl(value) ? null : value;
};
