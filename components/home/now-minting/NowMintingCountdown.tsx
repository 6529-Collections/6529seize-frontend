import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  type MintCountdownState,
  useMintCountdownState,
} from "@/hooks/useMintCountdownState";
import { useNftBalance } from "@/hooks/useNftBalance";
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
    hideMintBtn !== undefined ? { hideMintBtn } : undefined
  );

  const { connectedProfile } = useContext(AuthContext);
  const consolidationKey = connectedProfile?.consolidation_key ?? null;
  const { balance, isLoading: isBalanceLoading } = useNftBalance({
    consolidationKey,
    contract: MEMES_CONTRACT,
    tokenId: nftId,
  });

  const userOwnsNft = balance > 0;

  const needsBalanceCheck =
    (state.type === "sold_out" || state.type === "finalized") &&
    consolidationKey !== null;

  const showLoading = state.type === "loading" || (needsBalanceCheck && isBalanceLoading);

  return (
    <div className="tw-group tw-relative tw-mt-auto">
      <NowMintingCountdownContent
        state={state}
        showFootnote={userOwnsNft}
        forceLoading={showLoading}
      />
    </div>
  );
}

function NowMintingCountdownContent({
  state,
  showFootnote,
  forceLoading,
}: {
  readonly state: MintCountdownState;
  readonly showFootnote: boolean;
  readonly forceLoading: boolean;
}) {
  if (forceLoading) {
    return <NowMintingCountdownLoading />;
  }

  switch (state.type) {
    case "loading":
      return <NowMintingCountdownLoading />;
    case "error":
    case "sold_out":
    case "finalized":
      return <NowMintingCountdownStatus type={state.type} showFootnote={showFootnote} />;
    case "countdown":
      return <NowMintingCountdownActive countdown={state.countdown} />;
  }
}
