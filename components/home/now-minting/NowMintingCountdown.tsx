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
  readonly hideNextDrop?: boolean;
  readonly fullWidth?: boolean;
}

export default function NowMintingCountdown({
  nftId,
  hideMintBtn,
  hideNextDrop,
  fullWidth,
}: NowMintingCountdownProps) {
  const state = useMintCountdownState(
    nftId,
    hideMintBtn === undefined ? undefined : { hideMintBtn }
  );

  return (
    <div
      className={`tw-group tw-relative tw-mt-auto ${fullWidth ? "tw-w-full" : ""}`}
    >
      <NowMintingCountdownContent
        state={state}
        {...(hideNextDrop !== undefined && { hideNextDrop })}
      />
    </div>
  );
}

function NowMintingCountdownContent({
  state,
  hideNextDrop,
}: {
  readonly state: MintCountdownState;
  readonly hideNextDrop?: boolean;
}) {
  switch (state.type) {
    case "loading":
      return <NowMintingCountdownLoading />;
    case "error":
    case "sold_out":
    case "finalized":
      return (
        <NowMintingCountdownStatus
          type={state.type}
          {...(hideNextDrop !== undefined && { hideNextDrop })}
        />
      );
    case "countdown":
      return <NowMintingCountdownActive countdown={state.countdown} />;
  }
}
