import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import { useDropForgeManifoldClaim } from "@/hooks/useDropForgeManifoldClaim";
import { useNowMinting } from "@/hooks/useNowMinting";
import type { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";

type NowMintingStatus = {
  readonly nft: NFTWithMemesExtendedData | undefined;
  readonly isFetching: boolean;
  readonly status: ManifoldClaimStatus | null;
  readonly isStatusLoading: boolean;
  readonly error: unknown;
};

export const useNowMintingStatus = (): NowMintingStatus => {
  const { nft, isFetching, error } = useNowMinting();
  const { claim } = useDropForgeManifoldClaim(nft?.id ?? -1);

  return {
    nft,
    isFetching,
    status: claim?.status ?? null,
    isStatusLoading: !!nft && !claim,
    error,
  };
};
