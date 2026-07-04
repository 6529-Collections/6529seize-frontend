import { getMintTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildMemeCalendarMintResponse,
  MEME_CALENDAR_API_CACHE_HEADERS,
  MEME_CALENDAR_UNRESOLVED_TIMELINE_ERROR,
} from "../meme-calendar-response";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_MINT_ID = 100_000;

const invalidIdResponse = () =>
  NextResponse.json(
    {
      error:
        "Invalid id. Use a positive integer up to 100000 in /api/meme-calendar/<id>.",
    },
    { status: 400 }
  );

const unresolvedTimelineResponse = () =>
  NextResponse.json(
    {
      error: MEME_CALENDAR_UNRESOLVED_TIMELINE_ERROR,
    },
    { status: 422 }
  );

function parseMintId(id: string): number | null {
  if (!POSITIVE_INTEGER_PATTERN.test(id)) {
    return null;
  }

  const mintId = Number(id);
  if (!Number.isSafeInteger(mintId) || mintId > MAX_MINT_ID) {
    return null;
  }

  return mintId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mintId = parseMintId(id);

  if (mintId === null) {
    return invalidIdResponse();
  }

  try {
    const now = new Date();
    const timeline = getMintTimelineDetails(mintId);
    if (!Number.isFinite(timeline.instantUtc.getTime())) {
      return unresolvedTimelineResponse();
    }

    const response = buildMemeCalendarMintResponse(timeline, now);
    if (response === null) {
      return unresolvedTimelineResponse();
    }

    return NextResponse.json(response, {
      headers: MEME_CALENDAR_API_CACHE_HEADERS,
    });
  } catch {
    return unresolvedTimelineResponse();
  }
}
