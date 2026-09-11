import type { BaseNFT } from "@/entities/INFT";
import type { SupportedLocale } from "@/i18n/locales";
import ArtworkShareButton from "./ArtworkShareButton";

export default function NftArtworkShareButton({
  nft,
  kind,
  locale,
}: {
  readonly nft: BaseNFT;
  readonly kind: "memes" | "gradient";
  readonly locale: SupportedLocale;
}) {
  return (
    <ArtworkShareButton
      locale={locale}
      artwork={{
        kind,
        tokenId: nft.id,
        title: nft.name,
        artist: nft.artist,
        collection: kind === "memes" ? "The Memes" : "6529 Gradient",
        imageUrl: nft.scaled || nft.image || nft.thumbnail,
      }}
    />
  );
}
