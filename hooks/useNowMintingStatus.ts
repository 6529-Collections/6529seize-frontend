import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { useDropForgeManifoldClaim } from "@/hooks/useDropForgeManifoldClaim";
import type { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";
import { useNowMinting } from "@/hooks/useNowMinting";

type NowMintingStatus = {
  readonly nft: ApiMemesExtendedData | undefined;
  readonly isFetching: boolean;
  readonly status: ManifoldClaimStatus | null;
  readonly isDropComplete: boolean;
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
    isDropComplete: claim?.isDropComplete ?? false,
    isStatusLoading: !!nft && !claim,
    error,
  };
};
