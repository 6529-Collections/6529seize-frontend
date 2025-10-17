import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { XtdhReceivedCollectionsResponse, XtdhReceivedError } from "@/types/xtdh";
import {
  buildCollectionOptions,
  buildCollections,
  filterTokens,
  getMockTokens,
  type TokenFilters,
} from "../mock-data";

const RATE_LIMIT_PROBABILITY = 0.05;
const SERVER_ERROR_PROBABILITY = 0.05;
const NETWORK_DELAY_MS = 300;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 10;

const COLLECTION_SORT_FIELDS = [
  "total_rate",
  "total_received",
  "token_count",
  "collection_name",
] as const;

type CollectionSortField = (typeof COLLECTION_SORT_FIELDS)[number];

type SortDirection = "asc" | "desc";

function parseSortField(value: string | null): CollectionSortField | null {
  if (!value) return "total_rate";
  const normalized = value.toLowerCase();
  return COLLECTION_SORT_FIELDS.find((field) => field === normalized) ?? null;
}

function parseDirection(value: string | null): SortDirection | null {
  if (!value) return "desc";
  const normalized = value.toLowerCase();
  return normalized === "asc" || normalized === "desc" ? normalized : null;
}

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_PAGE;
  }
  return parsed;
}

function parsePageSize(value: string | null): number {
  if (!value) return DEFAULT_PAGE_SIZE;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.max(parsed, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
}

function parseCollectionsFilter(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profile: string }> }
) {
  const { profile } = await context.params;

  if (!profile) {
    const error: XtdhReceivedError = {
      error: "Bad Request",
      message: "Profile parameter is required",
      statusCode: 400,
    };

    return NextResponse.json(error, { status: 400 });
  }

  if (Math.random() < RATE_LIMIT_PROBABILITY) {
    const error: XtdhReceivedError = {
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
    const error: XtdhReceivedError = {
      error: "Internal Server Error",
      message: "Failed to fetch xTDH received collections",
      statusCode: 500,
    };

    return NextResponse.json(error, { status: 500 });
  }

  const url = new URL(request.url);
  const params = url.searchParams;

  const sort = parseSortField(params.get("sort"));
  if (!sort) {
    const error: XtdhReceivedError = {
      error: "Bad Request",
      message: "Invalid sort parameter",
      statusCode: 400,
    };
    return NextResponse.json(error, { status: 400 });
  }

  const dir = parseDirection(params.get("dir"));
  if (!dir) {
    const error: XtdhReceivedError = {
      error: "Bad Request",
      message: "Invalid dir parameter",
      statusCode: 400,
    };
    return NextResponse.json(error, { status: 400 });
  }

  const page = parsePage(params.get("page"));
  const pageSize = parsePageSize(params.get("page_size"));

  const collectionsFilter =
    parseCollectionsFilter(params.get("collections")) ??
    parseCollectionsFilter(params.get("collection"));

  const filters: TokenFilters = {
    collections: collectionsFilter,
    minRate: parseNumber(params.get("min_rate")),
    minGrantors: parseNumber(params.get("min_grantors")),
  };

  const tokens = getMockTokens(profile);
  const availableCollections = buildCollectionOptions(tokens);
  const filteredTokens = filterTokens(tokens, filters);
  const collections = buildCollections(filteredTokens);

  const sortedCollections = [...collections].sort((a, b) => {
    switch (sort) {
      case "total_rate":
        return dir === "asc"
          ? a.totalXtdhRate - b.totalXtdhRate
          : b.totalXtdhRate - a.totalXtdhRate;
      case "total_received":
        return dir === "asc"
          ? a.totalXtdhReceived - b.totalXtdhReceived
          : b.totalXtdhReceived - a.totalXtdhReceived;
      case "token_count":
        return dir === "asc"
          ? a.tokenCount - b.tokenCount
          : b.tokenCount - a.tokenCount;
      case "collection_name":
        return dir === "asc"
          ? a.collectionName.localeCompare(b.collectionName)
          : b.collectionName.localeCompare(a.collectionName);
      default:
        return 0;
    }
  });

  const totalCount = sortedCollections.length;
  const start = (page - 1) * pageSize;
  const paginatedCollections =
    start >= 0 && start < sortedCollections.length
      ? sortedCollections.slice(start, start + pageSize)
      : [];

  const response: XtdhReceivedCollectionsResponse = {
    collections: paginatedCollections,
    totalCount,
    page,
    pageSize,
    availableCollections,
  };

  await new Promise((resolve) => {
    setTimeout(resolve, NETWORK_DELAY_MS);
  });

  return NextResponse.json(response, { status: 200 });
}
