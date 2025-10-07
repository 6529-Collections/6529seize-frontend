import { NextResponse } from "next/server";
import { getOverviewStats } from "../mock-data";

export async function GET() {
  try {
    const stats = getOverviewStats();
    return NextResponse.json(stats);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load xTDH overview stats";
    return NextResponse.json(
      {
        error: "XTDH_STATS_ERROR",
        message,
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
