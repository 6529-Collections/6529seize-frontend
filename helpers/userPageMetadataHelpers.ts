import { getLargeSocialCardMetadata } from "@/components/providers/metadata";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { PageSSRMetadata } from "./Types";
import { formatAddress } from "./addressFormatting";
import { toMetadataExcerpt } from "./metadataText";

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

export const getUserPageTitle = (
  profile: ApiIdentity,
  path?: string
): string => {
  const display = profile.handle ?? formatAddress(profile.display);
  const pathTitle = path ? formatUserPageMetadataPath(path) : null;
  const pageTitle = pathTitle ? `${display} - ${pathTitle}` : display;
  return `${pageTitle} | 6529.io`;
};

export const getMetadataForUserPage = (
  profile: ApiIdentity,
  path?: string,
  publicBio?: string | null
): PageSSRMetadata => {
  const display = profile.handle ?? formatAddress(profile.display);
  const imageIdentity =
    profile.normalised_handle ??
    profile.handle ??
    profile.primary_wallet ??
    profile.display;
  const description =
    toMetadataExcerpt(publicBio) ??
    `Explore ${display}'s public identity and activity.`;
  return getLargeSocialCardMetadata({
    title: getUserPageTitle(profile, path),
    ogImage: `/api/og-metadata/profiles/${encodeURIComponent(imageIdentity)}`,
    ogImageAlt: `${display} profile social card`,
    description,
  });
};
