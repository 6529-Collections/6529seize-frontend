import {
  getCanonicalNextMintNumber,
  getMintNumberForMintDate,
  getMintTimelineDetails,
  toISO,
} from "@/components/meme-calendar/meme-calendar.helpers";

type MintTimelineDetails = ReturnType<typeof getMintTimelineDetails>;
type MintTimelineStatus = "past" | "live" | "upcoming";

export const MEME_CALENDAR_API_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=60",
} as const;

const MEME_CALENDAR_PATH = "/meme-calendar";

const getMemeCalendarMintPath = (mintNumber: number) =>
  `/the-memes/${mintNumber}`;

interface MemeCalendarMintResponse {
  readonly mint_number: number;
  readonly mint_date: string;
  readonly mint_start: string;
  readonly mint_end: string;
  readonly status: MintTimelineStatus;
  readonly season: number;
  readonly year: number;
  readonly epoch: number;
  readonly period: number;
  readonly era: number;
  readonly eon: number;
  readonly calendar_path: string;
  readonly mint_path: string;
}

export function getMintTimelineStatus(
  timeline: MintTimelineDetails,
  now: Date = new Date()
): MintTimelineStatus {
  if (now < timeline.instantUtc) {
    return "upcoming";
  }
  if (now < timeline.mintEndUtc) {
    return "live";
  }
  return "past";
}

export function getNextMintTimelineDetails(
  now: Date = new Date()
): MintTimelineDetails {
  return getMintTimelineDetails(getCanonicalNextMintNumber(now));
}

export function getCurrentMintTimelineDetails(
  now: Date = new Date()
): MintTimelineDetails | null {
  const nextTimeline = getNextMintTimelineDetails(now);
  const currentOrPreviousTimeline = getMintTimelineDetails(
    getMintNumberForMintDate(now)
  );
  const candidates = [nextTimeline, currentOrPreviousTimeline];
  const previousMintNumber = currentOrPreviousTimeline.mintNumber - 1;
  if (previousMintNumber > 0) {
    // Meme mint windows are shorter than the regular mint cadence, so the
    // live window can only be the date-derived mint or its immediate neighbor.
    candidates.push(getMintTimelineDetails(previousMintNumber));
  }

  return (
    candidates.find(
      (timeline) => getMintTimelineStatus(timeline, now) === "live"
    ) ?? null
  );
}

export function buildMemeCalendarMintResponse(
  timeline: MintTimelineDetails,
  now: Date = new Date()
): MemeCalendarMintResponse {
  return {
    mint_number: timeline.mintNumber,
    mint_date: toISO(timeline.instantUtc),
    mint_start: timeline.instantUtc.toISOString(),
    mint_end: timeline.mintEndUtc.toISOString(),
    status: getMintTimelineStatus(timeline, now),
    season: timeline.seasonNumber,
    year: timeline.yearNumber,
    epoch: timeline.epochNumber,
    period: timeline.periodNumber,
    era: timeline.eraNumber,
    eon: timeline.eonNumber,
    calendar_path: MEME_CALENDAR_PATH,
    mint_path: getMemeCalendarMintPath(timeline.mintNumber),
  };
}
