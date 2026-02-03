const BANNER_IMAGE_PREFIXES = ["http://", "https://", "ipfs://"];

const isBannerImageUrl = (value?: string | null): value is string => {
  if (!value) {
    return false;
  }

  return BANNER_IMAGE_PREFIXES.some((prefix) =>
    value.toLowerCase().startsWith(prefix)
  );
};

// Validates hex color format (backend only allows hex codes)
const isValidHexColor = (value: string): boolean => {
  return /^#[0-9a-fA-F]{6}$/.test(value);
};

export const getBannerImageUrl = (value?: string | null): string | null =>
  isBannerImageUrl(value) ? value : null;

export const getBannerColorValue = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  if (isBannerImageUrl(value)) {
    return null;
  }

  // Validate hex color format to prevent CSS injection
  if (!isValidHexColor(value)) {
    return null;
  }

  return value;
};
