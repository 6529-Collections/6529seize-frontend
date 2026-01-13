import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import {
  getDimensionsFromMetadata,
  getFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import NowMintingCountdown from "./NowMintingCountdown";
import NowMintingDetailsAccordion from "./NowMintingDetailsAccordion";
import NowMintingHeader from "./NowMintingHeader";
import NowMintingStatsGrid from "./NowMintingStatsGrid";

interface NowMintingDetailsProps {
  readonly nft: NFTWithMemesExtendedData;
}

export default function NowMintingDetails({ nft }: NowMintingDetailsProps) {
  const formatEth = (value: number) => {
    if (value === 0) return "0 ETH";
    return `${value.toFixed(5)} ETH`;
  };

  return (
    <div className="tw-w-full md:tw-w-1/2">
      <div className="tw-flex tw-h-full tw-flex-col tw-gap-4">
        <NowMintingHeader
          cardNumber={nft.id}
          title={nft.name}
          artistHandle={nft.artist_seize_handle}
          artistName={nft.artist}
        />
        <NowMintingStatsGrid
          nftId={nft.id}
          edition={`${nft.supply} / ${nft.edition_size}`}
          mintPrice={formatEth(nft.mint_price)}
          floorPrice={formatEth(nft.floor_price)}
        />
        <NowMintingDetailsAccordion
          mintDate={nft.mint_date}
          fileType={getFileTypeFromMetadata(nft.metadata)}
          dimensions={getDimensionsFromMetadata(nft.metadata)}
          collection={nft.collection}
          season={nft.season}
        />
        <NowMintingCountdown nftId={nft.id} />
      </div>
    </div>
  );
}
