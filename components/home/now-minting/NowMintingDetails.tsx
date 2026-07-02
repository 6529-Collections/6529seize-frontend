import { mainnet } from "viem/chains";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import {
  getDimensionsFromMetadata,
  getFileMimeTypeFromMetadata,
  getFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import NowMintingCountdown from "./NowMintingCountdown";
import NowMintingDetailsAccordion from "./NowMintingDetailsAccordion";
import NowMintingHeader from "./NowMintingHeader";
import NowMintingStatsGrid from "./NowMintingStatsGrid";
import LatestDropNextMintSubscribe from "./LatestDropNextMintSubscribe";

interface NowMintingDetailsProps {
  readonly nft: ApiMemesExtendedData;
}

export default function NowMintingDetails({ nft }: NowMintingDetailsProps) {
  const formatEth = (value: number) => {
    if (value <= 0) return "N/A";
    return `${Number.parseFloat(value.toFixed(5))} ETH`;
  };
  const floorPrice = formatEth(nft.floor_price);
  const fileMimeType = getFileMimeTypeFromMetadata(nft.metadata);

  return (
    <div className="tw-w-full">
      <div className="tw-flex tw-flex-col tw-gap-5">
        <NowMintingHeader
          cardNumber={nft.id}
          title={nft.name}
          artistHandle={nft.artist_seize_handle ?? ""}
          artistName={nft.artist}
          mediaMimeType={fileMimeType}
        />
        <NowMintingStatsGrid nftId={nft.id} floorPrice={floorPrice} />
        <LatestDropNextMintSubscribe showOnlyWhenSubscribed readonly />
        <NowMintingDetailsAccordion
          nftId={nft.id}
          mintDate={nft.mint_date ?? undefined}
          fileType={getFileTypeFromMetadata(nft.metadata)}
          dimensions={getDimensionsFromMetadata(nft.metadata)}
          collection={nft.collection}
          season={nft.season}
        />
        <NowMintingCountdown
          nftId={nft.id}
          contract={MEMES_CONTRACT}
          chainId={mainnet.id}
        />
      </div>
    </div>
  );
}
