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
    <div className="tw-mt-auto tw-group tw-relative tw-rounded-xl tw-bg-iron-900 tw-border tw-border-solid tw-border-white/5 tw-p-4">
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
