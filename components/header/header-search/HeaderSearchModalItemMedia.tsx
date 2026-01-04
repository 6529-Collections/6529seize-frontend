import { memo } from "react";
import Image from "next/image";
import type { NFTSearchResult } from "./HeaderSearchModalItem";

interface HeaderSearchModalItemMediaProps {
  readonly nft?: NFTSearchResult | undefined;
  readonly src?: string | null | undefined;
  readonly alt?: string | undefined;
  readonly roundedFull?: boolean | undefined;
}

const HeaderSearchModalItemMedia = memo(
  ({
    nft,
    src,
    alt = "",
    roundedFull = false,
  }: HeaderSearchModalItemMediaProps) => {
    const imgSrc =
      src ?? (nft ? nft.icon_url ?? nft.thumbnail_url ?? nft.image_url : null);
    const altText = nft ? nft.name ?? `#${nft.id}` : alt;

    if (!imgSrc) {
      return (
        <div
          className={`${
            roundedFull ? "tw-rounded-full" : "tw-rounded-md"
          } tw-h-9 tw-w-9 tw-bg-iron-900 tw-ring-1 tw-ring-white/10 tw-flex-shrink-0`}
        />
      );
    }

    return (
      <div className="tw-flex-shrink-0">
        <Image
          unoptimized
          priority
          loading="eager"
          width={36}
          height={36}
          className={`${
            roundedFull ? "tw-rounded-full" : "tw-rounded-md"
          } tw-object-contain tw-bg-iron-900 tw-ring-1 tw-ring-white/10`}
          style={{ height: "36px", width: "36px" }}
          src={imgSrc}
          alt={altText}
        />
      </div>
    );
  }
);

HeaderSearchModalItemMedia.displayName = "HeaderSearchModalItemMedia";

export default HeaderSearchModalItemMedia;
