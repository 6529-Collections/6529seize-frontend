import {
  type MintCountdownState,
  useMintCountdownState,
} from "@/hooks/useMintCountdownState";
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

  return (
    <div className="tw-group tw-relative tw-mt-auto">
      <NowMintingCountdownContent state={state} />
    </div>
  );
}

function NowMintingCountdownContent({
  state,
}: {
  readonly state: MintCountdownState;
}) {
  switch (state.type) {
    case "loading":
      return <NowMintingCountdownLoading />;
    case "error":
      return <NowMintingCountdownError />;
    case "sold_out":
      return <NowMintingCountdownSoldOut />;
    case "finalized":
      return <NowMintingCountdownFinalized />;
    case "countdown":
      return <NowMintingCountdownActive countdown={state.countdown} />;
  }
}
