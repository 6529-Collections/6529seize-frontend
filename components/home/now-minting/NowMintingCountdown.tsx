import {
  type MintCountdownState,
  useMintCountdownState,
} from "@/hooks/useMintCountdownState";
import NowMintingCountdownActive from "./NowMintingCountdownActive";
import NowMintingCountdownLoading from "./NowMintingCountdownLoading";
import NowMintingCountdownStatus from "./NowMintingCountdownStatus";

interface NowMintingCountdownProps {
  readonly nftId: number;
  readonly hideMintBtn?: boolean;
}

export default function NowMintingCountdown({
  nftId,
  hideMintBtn,
}: NowMintingCountdownProps) {
  const state = useMintCountdownState(
    nftId,
    hideMintBtn === undefined ? undefined : { hideMintBtn }
  );

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
    case "sold_out":
    case "finalized":
      return <NowMintingCountdownStatus type={state.type} />;
    case "countdown":
      return <NowMintingCountdownActive countdown={state.countdown} />;
  }
}
