import { NextResponse } from "next/server";

import {
  buildMemeCalendarMintResponse,
  getNextMintTimelineDetails,
} from "../meme-calendar-response";

export async function GET() {
  const now = new Date();
  const timeline = getNextMintTimelineDetails(now);

  return NextResponse.json(buildMemeCalendarMintResponse(timeline, now));
}
