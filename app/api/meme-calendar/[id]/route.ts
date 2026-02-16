import {
  getMintTimelineDetails,
  toISO,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

const invalidIdResponse = () =>
  NextResponse.json(
    { error: "Invalid id. Use a positive integer in /api/meme-calendar/<id>." },
    { status: 400 }
  );

const unresolvedTimelineResponse = () =>
  NextResponse.json(
    {
      error:
        "Unable to resolve calendar details for this mint id. The id may be out of range.",
    },
    { status: 422 }
  );

function parseMintId(id: string): number | null {
  if (!POSITIVE_INTEGER_PATTERN.test(id)) {
    return null;
  }

  const mintId = Number(id);
  if (!Number.isSafeInteger(mintId)) {
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

  if (mintId == null) {
    return invalidIdResponse();
  }

  try {
    const timeline = getMintTimelineDetails(mintId);
    if (!Number.isFinite(timeline.instantUtc.getTime())) {
      return unresolvedTimelineResponse();
    }

    return NextResponse.json({
      mint_date: toISO(timeline.instantUtc),
      season: timeline.seasonNumber,
      year: timeline.yearNumber,
      epoch: timeline.epochNumber,
      period: timeline.periodNumber,
      era: timeline.eraNumber,
      eon: timeline.eonNumber,
    });
  } catch {
    return unresolvedTimelineResponse();
  }
}
