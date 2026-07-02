import { NextResponse } from "next/server";

import {
  buildMemeCalendarMintResponse,
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
  const timeline = getNextMintTimelineDetails(now);
  const response = buildMemeCalendarMintResponse(timeline, now);
  if (response === null) {
    return unresolvedTimelineResponse();
  }

  return NextResponse.json(response, {
    headers: MEME_CALENDAR_API_CACHE_HEADERS,
  });
}
