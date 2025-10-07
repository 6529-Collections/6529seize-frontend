import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { XtdhStatsError, XtdhStatsResponse } from "@/types/xtdh";

const RATE_LIMIT_PROBABILITY = 0.05;
const SERVER_ERROR_PROBABILITY = 0.05;
const NETWORK_DELAY_MS = 300;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ profile: string }> }
) {
  const { profile } = await context.params;

  if (!profile) {
    const error: XtdhStatsError = {
      error: "Bad Request",
      message: "Profile parameter is required",
      statusCode: 400,
    };

    return NextResponse.json(error, { status: 400 });
  }

  if (Math.random() < RATE_LIMIT_PROBABILITY) {
    const error: XtdhStatsError = {
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      statusCode: 429,
    };

    return NextResponse.json(error, {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    });
  }

  if (Math.random() < SERVER_ERROR_PROBABILITY) {
    const error: XtdhStatsError = {
      error: "Internal Server Error",
      message: "Failed to fetch xTDH stats",
      statusCode: 500,
    };

    return NextResponse.json(error, { status: 500 });
  }

  const mockData: XtdhStatsResponse = {
    baseTdhRate: 1000,
    multiplier: 0.1,
    xtdhRateGranted: 80,
    xtdhRateReceived: 45,
    totalXtdhReceived: 12_450,
  };

  await new Promise((resolve) => {
    setTimeout(resolve, NETWORK_DELAY_MS);
  });

  return NextResponse.json(mockData, { status: 200 });
}
