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
  readonly title: string;
  readonly artist?: string | undefined;
  readonly collection: string;
}

const COLLECTIONS = {
  memes: { contract: MEMES_CONTRACT, path: "/the-memes" },
  gradient: { contract: GRADIENT_CONTRACT, path: "/6529-gradient" },
  nextgen: { contract: NEXTGEN_CONTRACT, path: "/nextgen/token" },
} as const;

export function getArtworkShareUrl(artwork: ArtworkShareDetails): string {
  // Public posts always link to the artwork, without local navigation or account state.
  return `https://6529.io${COLLECTIONS[artwork.kind].path}/${artwork.tokenId}`;
}

export function getArtworkExportUrl(
  artwork: ArtworkShareDetails,
  format: NftSocialCardFormat
): string {
  // The card is rendered from backend data for this token, not from display text.
  return getAbsoluteOgImageUrl(
    getNftSocialCardImagePath({
      contract: COLLECTIONS[artwork.kind].contract,
      id: artwork.tokenId,
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
