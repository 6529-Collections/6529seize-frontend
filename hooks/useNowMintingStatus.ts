import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";
import {
  useManifoldClaim,
  type ManifoldClaimStatus,
} from "@/hooks/useManifoldClaim";
import { mainnet } from "viem/chains";
import { useNowMinting } from "@/hooks/useNowMinting";

export type NowMintingStatus = {
  readonly nft: ApiMemesExtendedData | undefined;
  readonly isFetching: boolean;
  readonly status: ManifoldClaimStatus | null;
  readonly isDropComplete: boolean;
  readonly isStatusLoading: boolean;
  readonly isStatusError: boolean;
  readonly error: unknown;
  readonly refetch: () => Promise<unknown>;
};

export const useNowMintingStatus = (): NowMintingStatus => {
  const { nft, isFetching, error, refetch } = useNowMinting();
  const {
    claim,
    isError,
    isCompletionPending = false,
  } = useManifoldClaim({
    chainId: mainnet.id,
    contract: MEMES_CONTRACT,
    proxy: MANIFOLD_LAZY_CLAIM_CONTRACT,
    abi: MEMES_MANIFOLD_PROXY_ABI,
    identifier: nft?.id ?? -1,
  });
  const currentClaim = claim?.identifier === nft?.id ? claim : undefined;

  return {
    nft,
    isFetching,
    status: isCompletionPending ? null : (currentClaim?.status ?? null),
    isDropComplete:
      !isCompletionPending && (currentClaim?.isDropComplete ?? false),
    isStatusLoading: !!nft && (currentClaim ? isCompletionPending : !isError),
    isStatusError: !!nft && !currentClaim && isError,
    error,
    refetch,
  };
};
