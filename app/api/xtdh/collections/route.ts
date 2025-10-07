import { NextResponse } from "next/server";
import {
  getCollectionsResponse,
  type CollectionQueryOptions,
} from "../mock-data";

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

const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const page = parseNumber(searchParams.get("page"), 1);
    const pageSize = parseNumber(
      searchParams.get("page_size"),
      DEFAULT_PAGE_SIZE
    );
    const sortParam = (searchParams.get("sort") ??
      "total_rate") as CollectionQueryOptions["sort"];
    const directionParam =
      searchParams.get("dir")?.toLowerCase() === "asc" ? "asc" : "desc";

    const networks = parseList(searchParams.get("network"));
    const minRate = parseFloat(searchParams.get("min_rate"));
    const minGrantors = parseFloat(searchParams.get("min_grantors"));
    const grantorProfileId = searchParams.get("grantor") ?? undefined;
    const holderProfileId = searchParams.get("holder") ?? undefined;

    const response = getCollectionsResponse({
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
      error instanceof Error ? error.message : "Unable to load xTDH collections";
    return NextResponse.json(
      {
        error: "XTDH_COLLECTIONS_ERROR",
        message,
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
