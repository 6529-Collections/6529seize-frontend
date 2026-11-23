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
  transitionReadiness,
  nextMint,
  isNextMintLoading,
  isNextMintError,
}: {
  readonly mintStatus: NowMintingStatus;
  readonly transitionReadiness: boolean | null;
  readonly nextMint: ApiDropV2View | null;
  readonly isNextMintLoading: boolean;
  readonly isNextMintError: boolean;
}): boolean {
  const { isDropComplete, isStatusLoading, isStatusError, status } = mintStatus;
  if (isStatusLoading || transitionReadiness === null) return false;

  // An active mint or an unfinished grace period is enough to choose Latest.
  if (status !== null && (!isDropComplete || !transitionReadiness)) return true;
  return (
    !isNextMintLoading && !isNextMintError && (!isStatusError || !nextMint)
  );
}

function shouldKeepCurrentDrop({
  kind,
  hasServerSelection,
  isMintCompleteAndGraceElapsed,
  hasRefreshedWinner,
  nextMint,
}: {
  readonly kind: HomeDropSelection["kind"];
  readonly hasServerSelection: boolean;
  readonly isMintCompleteAndGraceElapsed: boolean;
  readonly hasRefreshedWinner: boolean;
  readonly nextMint: ApiDropV2View | null;
}): boolean {
  if (!isMintCompleteAndGraceElapsed) return kind === "next";
  if (hasRefreshedWinner) return false;

  // A cached winner or an empty cache can predate the server's decision.
  return hasServerSelection || (kind === "next" && nextMint === null);
}

export function resolveHomeDrop({
  nft,
  nextMint,
  resolvedDrop,
  hasServerSelection,
  isMintCompleteAndGraceElapsed,
  hasRefreshedWinner,
}: {
  readonly nft: ApiMemesExtendedData;
  readonly nextMint: ApiDropV2View | null;
  readonly resolvedDrop: HomeDropSelection | null;
  readonly hasServerSelection: boolean;
  readonly isMintCompleteAndGraceElapsed: boolean;
  readonly hasRefreshedWinner: boolean;
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
      isMintCompleteAndGraceElapsed,
      hasRefreshedWinner,
      nextMint,
    })
  ) {
    return resolvedDrop;
  }
  const shouldShowNext = shouldShowNextMintInLatestDrop({
    isMintEnded: isMintCompleteAndGraceElapsed,
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
