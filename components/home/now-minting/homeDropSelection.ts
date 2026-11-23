import { shouldShowNextMintInLatestDrop } from "@/helpers/mint-visibility.helpers";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import type { NowMintingStatus } from "@/hooks/useNowMintingStatus";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";

export type HomeDropSelection =
  | { readonly kind: "latest"; readonly nft: ApiMemesExtendedData }
  | {
      readonly kind: "next";
      readonly mintNumber: number;
      readonly drop: ApiDropV2View;
    };

export function canResolveHomeDrop({
  mintStatus,
  isTransitionReady,
  nextMint,
  isNextMintLoading,
  isNextMintError,
}: {
  readonly mintStatus: NowMintingStatus;
  readonly isTransitionReady: boolean | null;
  readonly nextMint: ApiDropV2View | null;
  readonly isNextMintLoading: boolean;
  readonly isNextMintError: boolean;
}): boolean {
  const { isDropComplete, isStatusLoading, isStatusError, status } = mintStatus;
  if (isStatusLoading || isTransitionReady === null) return false;

  // An active mint or an unfinished grace period is enough to choose Latest.
  if (status !== null && (!isDropComplete || !isTransitionReady)) return true;
  return (
    !isNextMintLoading && !isNextMintError && (!isStatusError || !nextMint)
  );
}

function shouldKeepCurrentDrop({
  kind,
  hasServerSelection,
  isTransitionReady,
  isWinnerFetchedAfterMount,
  nextMint,
}: {
  readonly kind: HomeDropSelection["kind"];
  readonly hasServerSelection: boolean;
  readonly isTransitionReady: boolean;
  readonly isWinnerFetchedAfterMount: boolean;
  readonly nextMint: ApiDropV2View | null;
}): boolean {
  if (!isTransitionReady) return kind === "next";
  if (isWinnerFetchedAfterMount) return false;

  // A cached winner or an empty cache can predate the server's decision.
  return hasServerSelection || (kind === "next" && nextMint === null);
}

export function resolveHomeDrop({
  nft,
  nextMint,
  resolvedDrop,
  hasServerSelection,
  isTransitionReady,
  isWinnerFetchedAfterMount,
}: {
  readonly nft: ApiMemesExtendedData;
  readonly nextMint: ApiDropV2View | null;
  readonly resolvedDrop: HomeDropSelection | null;
  readonly hasServerSelection: boolean;
  readonly isTransitionReady: boolean;
  readonly isWinnerFetchedAfterMount: boolean;
}): HomeDropSelection {
  const resolvedMintNumber =
    resolvedDrop?.kind === "next"
      ? resolvedDrop.mintNumber
      : resolvedDrop?.nft.id;
  if (resolvedDrop && nft.id < (resolvedMintNumber ?? 0)) {
    return resolvedDrop;
  }

  const hasSameMint = resolvedMintNumber === nft.id;
  if (
    resolvedDrop &&
    hasSameMint &&
    shouldKeepCurrentDrop({
      kind: resolvedDrop.kind,
      hasServerSelection,
      isTransitionReady,
      isWinnerFetchedAfterMount,
      nextMint,
    })
  ) {
    return resolvedDrop;
  }
  const shouldShowNext = shouldShowNextMintInLatestDrop({
    isMintEnded: isTransitionReady,
    nextMintExists: !!nextMint,
  });
  if (shouldShowNext && nextMint) {
    return resolvedDrop?.kind === "next" &&
      hasSameMint &&
      resolvedDrop.drop === nextMint
      ? resolvedDrop
      : { kind: "next", mintNumber: nft.id, drop: nextMint };
  }
  return resolvedDrop?.kind === "latest" && resolvedDrop.nft === nft
    ? resolvedDrop
    : { kind: "latest", nft };
}
