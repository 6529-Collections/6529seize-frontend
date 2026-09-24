import { mainnet } from "viem/chains";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import {
  getDimensionsFromMetadata,
  getFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import LatestDropAllowlistStatus from "./LatestDropAllowlistStatus";
import LatestDropNextMintSubscribe from "./LatestDropNextMintSubscribe";
import NowMintingCountdown from "./NowMintingCountdown";
import NowMintingDetailsAccordion from "./NowMintingDetailsAccordion";
import NowMintingHeader from "./NowMintingHeader";
import NowMintingStatsGrid from "./NowMintingStatsGrid";

interface NowMintingDetailsProps {
  readonly nft: ApiMemesExtendedData;
}

export default function NowMintingDetails({ nft }: NowMintingDetailsProps) {
  const formatEth = (value: number) => {
    if (value <= 0) return "N/A";
    return `${Number.parseFloat(value.toFixed(5))} ETH`;
  };
  const floorPrice = formatEth(nft.floor_price);

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-8 lg:tw-gap-10">
      <NowMintingHeader
        cardNumber={nft.id}
        title={nft.name}
        artistHandle={nft.artist_seize_handle ?? ""}
        artistName={nft.artist}
      />
      <div className="tw-flex tw-flex-col tw-gap-4">
        <NowMintingStatsGrid nftId={nft.id} floorPrice={floorPrice} />
        <NowMintingDetailsAccordion
          nftId={nft.id}
          mintDate={nft.mint_date ?? undefined}
          fileType={getFileTypeFromMetadata(nft.metadata)}
          dimensions={getDimensionsFromMetadata(nft.metadata)}
          collection={nft.collection}
          season={nft.season}
        />
      </div>
      <div className="tw-flex tw-flex-col tw-gap-4 empty:tw-hidden">
        <LatestDropAllowlistStatus tokenId={nft.id} />
        <LatestDropNextMintSubscribe tokenId={nft.id} statusSource="none" />
      </div>
      <NowMintingCountdown
        nftId={nft.id}
        contract={MEMES_CONTRACT}
        chainId={mainnet.id}
      />
    </div>
  );
}
