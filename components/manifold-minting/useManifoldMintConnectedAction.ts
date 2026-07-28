"use client";

import {
  getConnectedActionFingerprint,
  useConnectedAction,
} from "@/components/auth/useConnectedAction";
import type { MintingClaimsProofItem } from "@/generated/models/MintingClaimsProofItem";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

const MINT_DETAILS_CHANGED_MESSAGE =
  "Mint details changed while connecting. Review and try again.";

export function useManifoldMintConnectedAction({
  contract,
  chainId,
  claim,
  connectedAddress,
  mintForAddress,
  mintCount,
  feeWei,
  merkleProofs,
  merkleProofsMints,
  setMintError,
}: Readonly<{
  contract: string;
  chainId: number;
  claim: ManifoldClaim;
  connectedAddress: string | undefined;
  mintForAddress: string | null;
  mintCount: number;
  feeWei: bigint;
  merkleProofs: readonly MintingClaimsProofItem[];
  merkleProofsMints: readonly boolean[];
  setMintError: (message: string) => void;
}>) {
  const contextFingerprint = getConnectedActionFingerprint([
    contract,
    chainId,
    claim.status,
    claim.phase,
    claim.instanceId,
    claim.merkleRoot,
    claim.costWei,
    connectedAddress,
    mintForAddress,
    mintCount,
    feeWei,
    merkleProofs,
    merkleProofsMints,
  ]);

  return useConnectedAction({
    contextFingerprint,
    onContextChanged: () => setMintError(MINT_DETAILS_CHANGED_MESSAGE),
  });
}
