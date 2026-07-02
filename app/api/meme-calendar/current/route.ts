import { NextResponse } from "next/server";
import {
  buildMemeCalendarMintResponse,
  getCurrentMintTimelineDetails,
  getNextMintTimelineDetails,
  MEME_CALENDAR_API_CACHE_HEADERS,
  MEME_CALENDAR_UNRESOLVED_TIMELINE_ERROR,
} from "../meme-calendar-response";

const unresolvedTimelineResponse = () =>
  NextResponse.json(
    { error: MEME_CALENDAR_UNRESOLVED_TIMELINE_ERROR },
    { status: 422 }
  );

export async function GET() {
  const now = new Date();
  const current = getCurrentMintTimelineDetails(now);

  if (current) {
    const currentResponse = buildMemeCalendarMintResponse(current, now);
    if (currentResponse === null) {
      return unresolvedTimelineResponse();
    }

    return NextResponse.json(
      {
        status: "live",
        current: currentResponse,
      },
      { headers: MEME_CALENDAR_API_CACHE_HEADERS }
    );
  }

  const next = getNextMintTimelineDetails(now);
  const nextResponse = buildMemeCalendarMintResponse(next, now);
  if (nextResponse === null) {
    return unresolvedTimelineResponse();
  }

  return NextResponse.json(
    {
      status: "none",
      current: null,
      next: nextResponse,
    },
    { headers: MEME_CALENDAR_API_CACHE_HEADERS }
  );
}
