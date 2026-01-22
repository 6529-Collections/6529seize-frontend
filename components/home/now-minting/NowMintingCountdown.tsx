import {
  type MintCountdownState,
  useMintCountdownState,
} from "@/hooks/useMintCountdownState";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useShowThankYouForMint } from "@/hooks/useShowThankYouForMint";
import NowMintingCountdownActive from "./NowMintingCountdownActive";
import NowMintingCountdownError from "./NowMintingCountdownError";
import NowMintingCountdownFinalized from "./NowMintingCountdownFinalized";
import NowMintingCountdownLoading from "./NowMintingCountdownLoading";
import NowMintingCountdownSoldOut from "./NowMintingCountdownSoldOut";

interface NowMintingCountdownProps {
  readonly nftId: number;
}

export default function NowMintingCountdown({
  nftId,
}: NowMintingCountdownProps) {
  const state = useMintCountdownState(nftId);
  const shouldCheckParticipation =
    state.type === "sold_out" || state.type === "finalized";
  const { showThankYou } = useShowThankYouForMint({
    contract: MEMES_CONTRACT,
    tokenId: nftId,
    enabled: shouldCheckParticipation,
  });

  return (
    <div className="tw-group tw-relative tw-mt-auto">
      <NowMintingCountdownContent state={state} showThankYou={showThankYou} />
    </div>
  );
}

function NowMintingCountdownContent({
  state,
  showThankYou,
}: {
  readonly state: MintCountdownState;
  readonly showThankYou: boolean;
}) {
  switch (state.type) {
    case "loading":
      return <NowMintingCountdownLoading />;
    case "error":
      return <NowMintingCountdownError />;
    case "sold_out":
      return <NowMintingCountdownSoldOut showThankYou={showThankYou} />;
    case "finalized":
      return <NowMintingCountdownFinalized showThankYou={showThankYou} />;
    case "countdown":
      return <NowMintingCountdownActive countdown={state.countdown} />;
  }
}
