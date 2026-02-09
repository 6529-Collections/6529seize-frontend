import { isMintEligibleUtcDay } from "@/components/meme-calendar/meme-calendar.helpers";

function isMintingDayUtc(now: Date = new Date()): boolean {
  return isMintEligibleUtcDay(now);
}

interface ShouldShowNextMintAfterEndParams {
  readonly isMintEnded: boolean;
  readonly nextMintExists: boolean;
  readonly now?: Date;
}

export function shouldShowNextMintInLatestDrop({
  isMintEnded,
  nextMintExists,
  now,
}: ShouldShowNextMintAfterEndParams): boolean {
  if (!isMintEnded || !nextMintExists) return false;
  return !isMintingDayUtc(now);
}

export function shouldShowNextWinnerInComingUp({
  isMintEnded,
  nextMintExists,
  now,
}: ShouldShowNextMintAfterEndParams): boolean {
  if (!nextMintExists) return false;
  return !isMintEnded || isMintingDayUtc(now);
}
