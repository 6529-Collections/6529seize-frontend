import NFTImage from "@/components/nft-image/NFTImage";
import { getMediaType } from "@/components/nft-image/utils/media-type";
import { toBaseNftFromApiMemesExtendedData } from "@/components/the-memes/apiMemesExtendedDataAdapter";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import HomeArtworkFrame from "./HomeArtworkFrame";
import NowMintingArtwork from "./NowMintingArtwork";

export default function HomeNftArtwork({
  nft,
}: {
  readonly nft: ApiMemesExtendedData;
}) {
  const mediaNft = toBaseNftFromApiMemesExtendedData(nft);
  const mediaType = getMediaType(mediaNft, true);
  if (mediaType !== "video" && mediaType !== "image") {
    return <NowMintingArtwork nft={nft} />;
  }
  return (
    <HomeArtworkFrame fitImageToDetails={mediaType === "image"}>
      <NFTImage
        nft={mediaNft}
        animation
        height={650}
        transparentBG
        showBalance={false}
        artworkLayout
      />
    </HomeArtworkFrame>
  );
}
