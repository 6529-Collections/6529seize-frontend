interface ShouldShowNextMintAfterEndParams {
  readonly isMintEnded: boolean;
  readonly nextMintExists: boolean;
}

export const HOME_LATEST_DROP_GRACE_PERIOD_MINUTES = 10;

export function shouldShowNextMintInLatestDrop({
  isMintEnded,
  nextMintExists,
}: ShouldShowNextMintAfterEndParams): boolean {
  return isMintEnded && nextMintExists;
}

export function shouldShowNextWinnerInComingUp({
  isMintEnded,
  nextMintExists,
}: ShouldShowNextMintAfterEndParams): boolean {
  if (!nextMintExists) return false;
  return !isMintEnded;
}
