"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { MANIFOLD_LAZY_CLAIM_CONTRACT } from "@/constants/constants";
import useCapacitor from "@/hooks/useCapacitor";
import {
  ManifoldClaimStatus,
  ManifoldPhase,
  useManifoldClaim,
} from "@/hooks/useManifoldClaim";
import { useMemo, useState } from "react";

export interface CountdownData {
  readonly title: string;
  readonly targetDate: number;
  readonly showAllowlistInfo: boolean;
  readonly showMintBtn: boolean;
  readonly isActive: boolean;
}

export type MintCountdownState =
  | { type: "loading" }
  | { type: "error" }
  | { type: "sold_out" }
  | { type: "finalized" }
  | { type: "countdown"; countdown: CountdownData };

interface UseMintCountdownStateOptions {
  hideMintBtn?: boolean | undefined;
  contract: string;
  chainId: number;
}

export function useMintCountdownState(
  nftId: number,
  opts: UseMintCountdownStateOptions
): MintCountdownState {
  const [errorFromCallback, setErrorFromCallback] = useState(false);

  // Reset error state when nftId changes (during render, not in effect)
  const [prevNftId, setPrevNftId] = useState(nftId);
  if (nftId !== prevNftId) {
    setPrevNftId(nftId);
    setErrorFromCallback(false);
  }

  const { claim: manifoldClaim } = useManifoldClaim({
    chainId: opts.chainId,
    contract: opts.contract,
    proxy: MANIFOLD_LAZY_CLAIM_CONTRACT,
    abi: MEMES_MANIFOLD_PROXY_ABI,
    identifier: nftId,
    onError: () => {
      setErrorFromCallback(true);
    },
  });

  // Derive error state: callback fired AND (no data OR data has error)
  const isError =
    errorFromCallback && (!manifoldClaim || manifoldClaim.isError);

  const { isIos } = useCapacitor();
  const { country } = useCookieConsent();

  const showMintBtn = !opts.hideMintBtn && !(isIos && country !== "US");

  return useMemo((): MintCountdownState => {
    if (isError) {
      return { type: "error" };
    }

    if (!manifoldClaim) {
      return { type: "loading" };
    }

    if (manifoldClaim.isSoldOut) {
      return { type: "sold_out" };
    }

    if (manifoldClaim.isFinalized) {
      return { type: "finalized" };
    }

    const phaseName =
      manifoldClaim.phase === ManifoldPhase.ALLOWLIST && manifoldClaim.memePhase
        ? manifoldClaim.memePhase.name
        : manifoldClaim.phase;

    const isUpcoming = manifoldClaim.status === ManifoldClaimStatus.UPCOMING;

    return {
      type: "countdown",
      countdown: {
        title: `${phaseName} ${isUpcoming ? "Starts In" : "Ends In"}`,
        targetDate: isUpcoming
          ? manifoldClaim.startDate
          : manifoldClaim.endDate,
        showAllowlistInfo: manifoldClaim.phase === ManifoldPhase.ALLOWLIST,
        showMintBtn,
        isActive: !isUpcoming,
      },
    };
  }, [manifoldClaim, isError, showMintBtn]);
}
