"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import useCapacitor from "@/hooks/useCapacitor";
import {
  ManifoldClaimStatus,
  ManifoldPhase,
  useMemesManifoldClaim,
} from "@/hooks/useManifoldClaim";
import MintCountdownBox from "./MintCountdownBox";

export default function MemePageMintCountdown(
  props: Readonly<{
    nft_id: number;
    hide_mint_btn?: boolean;
  }>
) {
  const manifoldClaim = useMemesManifoldClaim(props.nft_id);

  const { isIos } = useCapacitor();
  const { country } = useCookieConsent();

  const getMintInfo = () => {
    if (!manifoldClaim) {
      return undefined;
    }

    const phaseName =
      manifoldClaim.phase === ManifoldPhase.ALLOWLIST && manifoldClaim.memePhase
        ? manifoldClaim.memePhase.name
        : manifoldClaim.phase;

    const title =
      manifoldClaim.status === ManifoldClaimStatus.UPCOMING
        ? `${phaseName} Starts In`
        : `${phaseName} Ends In`;

    const date =
      manifoldClaim.status === ManifoldClaimStatus.UPCOMING
        ? manifoldClaim.startDate
        : manifoldClaim.endDate;

    const showAllowlistInfo = manifoldClaim.phase === ManifoldPhase.ALLOWLIST;
    const isFinalized = manifoldClaim.isFinalized;
    const isSoldOut = manifoldClaim.isSoldOut;
    const isEnded = manifoldClaim.status === ManifoldClaimStatus.ENDED;

    return {
      title,
      date,
      showAllowlistInfo,
      isFinalized,
      isEnded,
      isSoldOut,
    };
  };

  const hideMintBtn = props.hide_mint_btn || (isIos && country !== "US");

  return (
    <MintCountdownBox
      mintInfo={getMintInfo()}
      linkInfo={{
        href: "/the-memes/mint",
        target: "_self",
      }}
      hideMintBtn={hideMintBtn}
      small={props.hide_mint_btn}
    />
  );
}
