import { getLargeSocialCardMetadata } from "@/components/providers/metadata";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
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
  path?: string,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => {
  const display = profile.handle ?? formatAddress(profile.display);
  const pathTitle = path ? formatUserPageMetadataPath(path) : null;
  const pageTitle = pathTitle
    ? t(locale, "profile.metadata.pathTitle", { display, pathTitle })
    : display;
  return t(locale, "profile.metadata.title", { pageTitle });
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
    t(DEFAULT_LOCALE, "profile.metadata.description", { display });
  return getLargeSocialCardMetadata({
    title: getUserPageTitle(profile, path),
    ogImage: `/api/og-metadata/profiles/${encodeURIComponent(imageIdentity)}`,
    ogImageAlt: t(DEFAULT_LOCALE, "profile.metadata.ogImageAlt", { display }),
    description,
  });
};
