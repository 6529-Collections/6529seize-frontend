import "server-only";

import type { TheMemesSearchParams } from "@/components/the-memes/theMemesRouteParams";
import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { anonymousSsrFetch } from "@/lib/fetch/ssrFetch";

const INITIAL_PAGE_SIZE = 48;

export type TheMemesInitialData = {
  readonly nfts: ApiMemesExtendedData[];
  readonly nextPage: string | undefined;
};

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isDefaultBrowse(searchParams: TheMemesSearchParams): boolean {
  const sort = getSingleSearchParam(searchParams.sort);
  const sortDirection = getSingleSearchParam(searchParams.sort_dir);
  const season = getSingleSearchParam(searchParams.szn);
  const year = getSingleSearchParam(searchParams.year);

  return (
    (sort === undefined || sort.toLowerCase() === "age") &&
    (sortDirection === undefined || sortDirection.toLowerCase() === "asc") &&
    season === undefined &&
    year === undefined
  );
}

function getInitialDataUrl(): string {
  const query = new URLSearchParams({
    page_size: String(INITIAL_PAGE_SIZE),
    sort: "mint_date",
    sort_direction: "ASC",
  });

  return `${publicEnv.API_ENDPOINT}/api/memes_extended_data?${query.toString()}`;
}

function isMemesResponse(
  value: unknown
): value is Pick<DBResponse<ApiMemesExtendedData>, "data" | "next"> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { readonly data?: unknown }).data)
  );
}

/**
 * Provides the public default collection page to the server render. Filtered
 * views retain their existing client-side loading path so their query semantics
 * and cursor handling are unchanged.
 */
export async function getTheMemesInitialData(
  searchParams: TheMemesSearchParams
): Promise<TheMemesInitialData | undefined> {
  if (!isDefaultBrowse(searchParams)) {
    return undefined;
  }

  try {
    const response = await anonymousSsrFetch(getInitialDataUrl(), {
      cache: "no-store",
    });
    if (!response.ok) {
      return undefined;
    }

    const body: unknown = await response.json();
    if (!isMemesResponse(body)) {
      return undefined;
    }

    return {
      nfts: body.data,
      nextPage: typeof body.next === "string" ? body.next : undefined,
    };
  } catch {
    return undefined;
  }
}
