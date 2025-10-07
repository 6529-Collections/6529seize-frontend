import { NextResponse } from "next/server";
import { getTokensResponse, type TokenQueryOptions } from "../mock-data";

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFloat(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const DEFAULT_PAGE_SIZE = 25;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const page = parseNumber(params.get("page"), 1);
    const pageSize = parseNumber(params.get("page_size"), DEFAULT_PAGE_SIZE);
    const sortParam = (params.get("sort") ?? "rate") as TokenQueryOptions["sort"];
    const directionParam =
      params.get("dir")?.toLowerCase() === "asc" ? "asc" : "desc";

    const networks = parseList(params.get("network"));
    const minRate = parseFloat(params.get("min_rate"));
    const minGrantors = parseFloat(params.get("min_grantors"));
    const grantorProfileId = params.get("grantor") ?? undefined;
    const holderProfileId = params.get("holder") ?? undefined;

    const response = getTokensResponse({
      page,
      pageSize,
      sort: sortParam,
      dir: directionParam,
      networks,
      minRate,
      minGrantors,
      grantorProfileId: grantorProfileId ?? null,
      holderProfileId: holderProfileId ?? null,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load xTDH tokens";
    return NextResponse.json(
      {
        error: "XTDH_TOKENS_ERROR",
        message,
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
