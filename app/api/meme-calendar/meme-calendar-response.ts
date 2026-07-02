import {
  getCanonicalNextMintNumber,
  getMintNumberForMintDate,
  getMintTimelineDetails,
  nextMintDateOnOrAfter,
  SZN1_RANGE,
  toISO,
  type ZoomLevel,
} from "@/components/meme-calendar/meme-calendar.helpers";

type MintTimelineDetails = ReturnType<typeof getMintTimelineDetails>;
type MintTimelineStatus = "past" | "live" | "upcoming";
type MintTimelineRange = MintTimelineDetails["ranges"][ZoomLevel];

interface MemeCalendarMintPositionFields {
  readonly position_in_season: number;
  readonly position_in_year: number;
  readonly position_in_epoch: number;
  readonly position_in_period: number;
  readonly position_in_era: number;
  readonly position_in_eon: number;
}

export const MEME_CALENDAR_API_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=60",
} as const;
export const MEME_CALENDAR_UNRESOLVED_TIMELINE_ERROR =
  "Unable to resolve calendar details for this mint id. The id may be out of range.";

const MEME_CALENDAR_PATH = "/meme-calendar";

const getMemeCalendarMintPath = (mintNumber: number) =>
  `/the-memes/${mintNumber}`;

interface MemeCalendarMintResponse extends MemeCalendarMintPositionFields {
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

function isHistoricalIntroRange(range: MintTimelineRange): boolean {
  return (
    range.start.getTime() === SZN1_RANGE.start.getTime() &&
    range.end.getTime() === SZN1_RANGE.end.getTime()
  );
}

function getFirstMintNumberInRange(range: MintTimelineRange): number | null {
  if (isHistoricalIntroRange(range)) {
    return 1;
  }

  const firstMintDate = nextMintDateOnOrAfter(range.start);
  if (firstMintDate.getTime() > range.end.getTime()) {
    return null;
  }

  return getMintNumberForMintDate(firstMintDate);
}

function getPositionInRange(
  timeline: MintTimelineDetails,
  zoom: ZoomLevel
): number | null {
  const firstMintNumber = getFirstMintNumberInRange(timeline.ranges[zoom]);
  if (firstMintNumber === null) {
    return null;
  }

  return timeline.mintNumber - firstMintNumber + 1;
}

function getMemeCalendarMintPositionFields(
  timeline: MintTimelineDetails
): MemeCalendarMintPositionFields | null {
  const positionInSeason = getPositionInRange(timeline, "szn");
  const positionInYear = getPositionInRange(timeline, "year");
  const positionInEpoch = getPositionInRange(timeline, "epoch");
  const positionInPeriod = getPositionInRange(timeline, "period");
  const positionInEra = getPositionInRange(timeline, "era");
  const positionInEon = getPositionInRange(timeline, "eon");

  if (
    positionInSeason === null ||
    positionInYear === null ||
    positionInEpoch === null ||
    positionInPeriod === null ||
    positionInEra === null ||
    positionInEon === null
  ) {
    return null;
  }

  return {
    position_in_season: positionInSeason,
    position_in_year: positionInYear,
    position_in_epoch: positionInEpoch,
    position_in_period: positionInPeriod,
    position_in_era: positionInEra,
    position_in_eon: positionInEon,
  };
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
): MemeCalendarMintResponse | null {
  const positionFields = getMemeCalendarMintPositionFields(timeline);
  if (positionFields === null) {
    return null;
  }

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
    ...positionFields,
    calendar_path: MEME_CALENDAR_PATH,
    mint_path: getMemeCalendarMintPath(timeline.mintNumber),
  };
}
