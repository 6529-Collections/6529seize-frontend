import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import { MemeSubscriptionAwarenessRowSpace } from "@/components/home/now-minting/MemeSubscriptionAwarenessRow";
import NowMintingCountdown from "@/components/home/now-minting/NowMintingCountdown";
import NowMintingCountdownLoading from "@/components/home/now-minting/NowMintingCountdownLoading";
import { MEMES_CONTRACT } from "@/constants/constants";
import { mainnet } from "viem/chains";

export default function MemePageMintSlot({
  tokenId,
  reserveSpace,
}: {
  readonly tokenId: number;
  readonly reserveSpace: boolean;
}) {
  if (reserveSpace) {
    return (
      <div aria-hidden="true" className="tw-invisible tw-w-full tw-space-y-3">
        <NowMintingCountdownLoading />
        <MemeSubscriptionAwarenessRowSpace />
      </div>
    );
  }

  return (
    <div className="tw-w-full tw-space-y-3">
      <NowMintingCountdown
        nftId={tokenId}
        contract={MEMES_CONTRACT}
        chainId={mainnet.id}
        fullWidth
      />
      <LatestDropNextMintSubscribe tokenId={tokenId} statusSource="none" />
    </div>
  );
}
