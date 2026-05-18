import NFTLeaderboard from "@/components/leaderboard/NFTLeaderboard";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { MemeCollectorsStats } from "./MemePageLiveStats";

export function MemePageCollectorsSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: MemesExtendedData | undefined;
}) {
  if (props.show && props.nft) {
    return (
      <>
        {props.nftMeta && (
          <div>
            <MemeCollectorsStats nftMeta={props.nftMeta} />
          </div>
        )}
        <div className="tw-pt-3">
          <NFTLeaderboard contract={props.nft.contract} nftId={props.nft.id} />
        </div>
      </>
    );
  }

  return <></>;
}
