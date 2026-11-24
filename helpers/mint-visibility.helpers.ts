import {
  dateFromMintNumber,
  mintEndInstantUtcForMintDay,
} from "@/shared/memes-calendar/calendar";

interface ShouldShowNextMintAfterEndParams {
  readonly isMintEnded: boolean;
  readonly nextMintExists: boolean;
}

export const HOME_LATEST_DROP_GRACE_PERIOD_MINUTES = 10;

export function getLatestDropTransitionTime(mintNumber: number): number | null {
  if (
    !Number.isSafeInteger(mintNumber) ||
    mintNumber < 1 ||
    mintNumber > 100_000
  ) {
    return null;
  }

  const mintEnd = mintEndInstantUtcForMintDay(dateFromMintNumber(mintNumber));
  return mintEnd.getTime() + HOME_LATEST_DROP_GRACE_PERIOD_MINUTES * 60_000;
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
