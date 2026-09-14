import {
  getAbsoluteOgImageUrl,
  getNftSocialCardImagePath,
  type NftSocialCardFormat,
} from "@/components/providers/metadata";
import {
  GRADIENT_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export interface ArtworkShareDetails {
  readonly kind: "memes" | "gradient" | "nextgen";
  readonly tokenId: number;
  readonly displayId?: number | undefined;
  readonly title: string;
  readonly artist?: string | undefined;
  readonly collection: string;
  readonly imageUrl: string;
}

const COLLECTIONS = {
  memes: { contract: MEMES_CONTRACT, path: "/the-memes", badge: "The Memes" },
  gradient: {
    contract: GRADIENT_CONTRACT,
    path: "/6529-gradient",
    badge: "6529 Gradient",
  },
  nextgen: {
    contract: NEXTGEN_CONTRACT,
    path: "/nextgen/token",
    badge: "NextGen",
  },
} as const;

export function getArtworkShareUrl(artwork: ArtworkShareDetails): string {
  // Public posts always link to the artwork, without local navigation or account state.
  return `https://6529.io${COLLECTIONS[artwork.kind].path}/${artwork.tokenId}`;
}

export function getArtworkExportUrl(
  artwork: ArtworkShareDetails,
  format: NftSocialCardFormat
): string {
  const collection = COLLECTIONS[artwork.kind];
  return getAbsoluteOgImageUrl(
    getNftSocialCardImagePath({
      contract: collection.contract,
      id: artwork.tokenId,
      displayId: artwork.displayId,
      title: artwork.title,
      artist: artwork.artist,
      collection: artwork.collection,
      badge: collection.badge,
      image: artwork.imageUrl,
      format,
    })
  );
}

export function getArtworkCaption(
  artwork: ArtworkShareDetails,
  locale: SupportedLocale
): string {
  const artist = artwork.artist?.trim();
  return t(
    locale,
    artist
      ? "artworkShare.captionWithArtist"
      : "artworkShare.captionWithoutArtist",
    {
      title: artwork.title,
      artist: artist ?? "",
      collection: artwork.collection,
      url: getArtworkShareUrl(artwork),
    }
  );
}

export function getArtworkExportFilename(
  artwork: ArtworkShareDetails,
  format: NftSocialCardFormat
): string {
  return `6529-${artwork.kind}-${artwork.tokenId}-${format}.png`;
}

export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
