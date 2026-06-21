import {
  getCurrentMintTimelineDetails,
  getNextMintTimelineDetails,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { NextResponse } from "next/server";
import { buildMemeCalendarMintResponse } from "../meme-calendar-response";

export async function GET() {
  const now = new Date();
  const current = getCurrentMintTimelineDetails(now);

  if (current) {
    return NextResponse.json({
      status: "live",
      current: buildMemeCalendarMintResponse(current, now),
    });
  }

  const next = getNextMintTimelineDetails(now);

  return NextResponse.json({
    status: "none",
    current: null,
    next: buildMemeCalendarMintResponse(next, now),
  });
}
