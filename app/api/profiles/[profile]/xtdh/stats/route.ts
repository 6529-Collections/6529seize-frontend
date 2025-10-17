import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { XtdhStatsError, XtdhStatsResponse } from "@/types/xtdh";

const RATE_LIMIT_PROBABILITY = 0.05;
const SERVER_ERROR_PROBABILITY = 0.05;
const NETWORK_DELAY_MS = 300;

function normalizeProfileIdentifier(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/^@/, "").toLowerCase();
}

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

  const normalizedProfile = normalizeProfileIdentifier(profile);

  let mockData: XtdhStatsResponse;

  if (normalizedProfile === "simo") {
    mockData = {
      baseTdhRate: 12_212,
      multiplier: 0.1,
      dailyCapacity: 1_221,
      xtdhRateGranted: 0,
      xtdhRateAutoAccruing: 1_221,
      xtdhRateReceived: 3_389,
      totalXtdhReceived: 3_389,
      totalXtdhGranted: 18_540,
      allocationsCount: 0,
      collectionsAllocatedCount: 0,
      tokensAllocatedCount: 0,
    };
  } else if (normalizedProfile === "test1234") {
    mockData = {
      baseTdhRate: 1_000,
      multiplier: 0.1,
      dailyCapacity: 100,
      xtdhRateGranted: 80,
      xtdhRateAutoAccruing: 20,
      xtdhRateReceived: 45,
      totalXtdhReceived: 12_450,
      totalXtdhGranted: 9_875,
      allocationsCount: 2,
      collectionsAllocatedCount: 2,
      tokensAllocatedCount: 5,
    };
  } else {
    mockData = {
      baseTdhRate: 0,
      multiplier: 0.1,
      dailyCapacity: 0,
      xtdhRateGranted: 0,
      xtdhRateAutoAccruing: 0,
      xtdhRateReceived: 0,
      totalXtdhReceived: 0,
      totalXtdhGranted: 0,
      allocationsCount: 0,
      collectionsAllocatedCount: 0,
      tokensAllocatedCount: 0,
    };
  }

  await new Promise((resolve) => {
    setTimeout(resolve, NETWORK_DELAY_MS);
  });

  return NextResponse.json(mockData, { status: 200 });
}
