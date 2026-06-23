import { NextResponse } from "next/server";

import {
  buildMemeCalendarMintResponse,
  getNextMintTimelineDetails,
  MEME_CALENDAR_API_CACHE_HEADERS,
} from "../meme-calendar-response";

export async function GET() {
  const now = new Date();
  const timeline = getNextMintTimelineDetails(now);

  return NextResponse.json(buildMemeCalendarMintResponse(timeline, now), {
    headers: MEME_CALENDAR_API_CACHE_HEADERS,
  });
}
