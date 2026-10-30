import { getMintNumberForMintDate, getMintTimelineDetails } from './calendar';
import { getCanonicalNextMintNumber } from './upcoming';

type MintTimelineDetails = ReturnType<typeof getMintTimelineDetails>;
type MintTimelineStatus = 'past' | 'live' | 'upcoming';

function validateNow(now: Date): void {
  if (!Number.isFinite(now.getTime()))
    throw new RangeError('Invalid calendar time');
}

export function getMintTimelineStatus(
  timeline: MintTimelineDetails,
  now: Date = new Date()
): MintTimelineStatus {
  validateNow(now);
  if (now < timeline.instantUtc) return 'upcoming';
  if (now < timeline.mintEndUtc) return 'live';
  return 'past';
}

export function getNextMintTimelineDetails(
  now: Date = new Date()
): MintTimelineDetails {
  validateNow(now);
  return getMintTimelineDetails(getCanonicalNextMintNumber(now));
}

export function getCurrentMintTimelineDetails(
  now: Date = new Date()
): MintTimelineDetails | null {
  validateNow(now);
  const nextTimeline = getNextMintTimelineDetails(now);
  const currentOrPreviousTimeline = getMintTimelineDetails(
    getMintNumberForMintDate(now)
  );
  const candidates = [nextTimeline, currentOrPreviousTimeline];
  const previousMintNumber = currentOrPreviousTimeline.mintNumber - 1;
  if (previousMintNumber > 0) {
    candidates.push(getMintTimelineDetails(previousMintNumber));
  }
  return (
    candidates.find(
      (timeline) => getMintTimelineStatus(timeline, now) === 'live'
    ) ?? null
  );
}
