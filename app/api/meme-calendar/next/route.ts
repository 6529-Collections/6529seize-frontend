import { getNextMintTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import { NextResponse } from "next/server";
import { buildMemeCalendarMintResponse } from "../meme-calendar-response";

export async function GET() {
  const now = new Date();
  const timeline = getNextMintTimelineDetails(now);

  return NextResponse.json(buildMemeCalendarMintResponse(timeline, now));
}
