import { NextResponse } from "next/server";
import {
  buildMemeCalendarMintResponse,
  getCurrentMintTimelineDetails,
  getNextMintTimelineDetails,
  MEME_CALENDAR_API_CACHE_HEADERS,
} from "../meme-calendar-response";

export async function GET() {
  const now = new Date();
  const current = getCurrentMintTimelineDetails(now);

  if (current) {
    return NextResponse.json(
      {
        status: "live",
        current: buildMemeCalendarMintResponse(current, now),
      },
      { headers: MEME_CALENDAR_API_CACHE_HEADERS }
    );
  }

  const next = getNextMintTimelineDetails(now);

  return NextResponse.json(
    {
      status: "none",
      current: null,
      next: buildMemeCalendarMintResponse(next, now),
    },
    { headers: MEME_CALENDAR_API_CACHE_HEADERS }
  );
}
