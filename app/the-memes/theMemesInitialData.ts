import "next/dist/compiled/server-only";

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
    "data" in value &&
    Array.isArray(value.data) &&
    value.data.every(isRenderableMeme)
  );
}

function isRenderableMeme(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const nft = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(nft["id"]) &&
    Number(nft["id"]) > 0 &&
    ["contract", "name", "thumbnail", "scaled", "meme_name"].every(
      (key) => typeof nft[key] === "string"
    ) &&
    ["image", "animation", "compressed_animation", "mint_date"].every(
      (key) => nft[key] === null || typeof nft[key] === "string"
    )
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
