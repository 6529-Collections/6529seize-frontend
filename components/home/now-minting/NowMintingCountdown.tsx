import {
  type MintCountdownState,
  useMintCountdownState,
} from "@/hooks/useMintCountdownState";
import NowMintingCountdownActive from "./NowMintingCountdownActive";
import NowMintingCountdownLoading from "./NowMintingCountdownLoading";
import NowMintingCountdownStatus from "./NowMintingCountdownStatus";

interface NowMintingCountdownProps {
  readonly variant?: "default" | "home";
  readonly nftId: number;
  readonly contract: string;
  readonly chainId: number;
  readonly hideMintBtn?: boolean;
  readonly hideNextDrop?: boolean;
  readonly fullWidth?: boolean;
}

export default function NowMintingCountdown({
  variant = "default",
  nftId,
  contract,
  chainId,
  hideMintBtn,
  hideNextDrop,
  fullWidth,
}: NowMintingCountdownProps) {
  const state = useMintCountdownState(nftId, {
    contract,
    chainId,
    hideMintBtn,
  });

  return (
    <div
      className={`tw-group tw-relative tw-mt-auto ${fullWidth ? "tw-w-full" : ""}`}
    >
      <NowMintingCountdownContent
        state={state}
        variant={variant}
        {...(hideNextDrop !== undefined && { hideNextDrop })}
      />
    </div>
  );
}

function NowMintingCountdownContent({
  state,
  variant,
  hideNextDrop,
}: {
  readonly state: MintCountdownState;
  readonly variant: "default" | "home";
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
      return (
        <NowMintingCountdownActive
          countdown={state.countdown}
          variant={variant}
        />
      );
  }
}
