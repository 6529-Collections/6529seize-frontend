import { memo } from "react";
import { NFTSearchResult } from "./HeaderSearchModalItem";
import Image from "next/image";
const HeaderSearchModalItemMedia = memo(
  ({ nft }: { readonly nft: NFTSearchResult }) => {
    const imgSrc = nft.icon_url ?? nft.thumbnail_url ?? nft.image_url;
    if (!imgSrc) {
      return <></>;
    }
    return (
      <Image
        priority
        loading="eager"
        width={0}
        height={25}
        style={{ height: "25px", width: "auto" }}
        src={imgSrc}
        alt={nft.name ?? `#${nft.id}`}
      />
    );
  }
);

HeaderSearchModalItemMedia.displayName = "HeaderSearchModalItemMedia";

export default HeaderSearchModalItemMedia;
