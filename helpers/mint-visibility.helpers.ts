interface ShouldShowNextMintAfterEndParams {
  readonly isMintEnded: boolean;
  readonly nextMintExists: boolean;
}

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
