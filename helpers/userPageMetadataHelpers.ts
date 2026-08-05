import { getLargeSocialCardMetadata } from "@/components/providers/metadata";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { PageSSRMetadata } from "./Types";
import { formatAddress } from "./addressFormatting";

const formatUserPageMetadataPath = (path: string): string | null => {
  const words = path
    .split(/[/_-]+/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (words.length === 0) return null;
  return words
    .map((word) => {
      const normalized = word.toLowerCase();
      return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
    })
    .join(" ");
};

export const getMetadataForUserPage = (
  profile: ApiIdentity,
  path?: string
): PageSSRMetadata => {
  const display = profile.handle ?? formatAddress(profile.display);
  const pathTitle = path ? formatUserPageMetadataPath(path) : null;
  const imageIdentity =
    profile.normalised_handle ??
    profile.handle ??
    profile.primary_wallet ??
    profile.display;
  return getLargeSocialCardMetadata({
    title: pathTitle ? `${display} - ${pathTitle}` : display,
    ogImage: `/api/og-metadata/profiles/${encodeURIComponent(imageIdentity)}`,
    ogImageAlt: `${display} profile social card`,
    description: "Identity",
  });
};
