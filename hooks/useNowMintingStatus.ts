import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { useDropForgeManifoldClaim } from "@/hooks/useDropForgeManifoldClaim";
import type { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";
import { useNowMinting } from "@/hooks/useNowMinting";

export type NowMintingStatus = {
  readonly nft: ApiMemesExtendedData | undefined;
  readonly isFetching: boolean;
  readonly status: ManifoldClaimStatus | null;
  readonly isDropComplete: boolean;
  readonly isStatusLoading: boolean;
  readonly error: unknown;
  readonly refetch: () => Promise<unknown>;
};

export const useNowMintingStatus = (): NowMintingStatus => {
  const { nft, isFetching, error, refetch } = useNowMinting();
  const { claim, isError } = useDropForgeManifoldClaim(nft?.id ?? -1);
  const currentClaim = claim?.identifier === nft?.id ? claim : undefined;

  return {
    nft,
    isFetching,
    status: currentClaim?.status ?? null,
    isDropComplete: currentClaim?.isDropComplete ?? false,
    isStatusLoading: !!nft && !currentClaim && !isError,
    error,
    refetch,
  };
};
