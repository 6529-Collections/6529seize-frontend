import NFTImage from "@/components/nft-image/NFTImage";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";

interface NowMintingArtworkProps {
  readonly nft: NFTWithMemesExtendedData;
}

export default function NowMintingArtwork({ nft }: NowMintingArtworkProps) {
  return (
    <div className="tw-flex tw-w-full tw-items-start tw-justify-center">
      <NFTImage nft={nft} animation={true} height={650} showBalance={true} />
    </div>
  );
}
