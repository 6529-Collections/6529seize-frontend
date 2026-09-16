import MemePageComponent from "@/components/the-memes/MemePage";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { getCanonicalNextMintNumber } from "@/components/meme-calendar/meme-calendar.helpers";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { normalizeLocale } from "@/i18n/locales";
import { getNftCanonicalPath } from "@/helpers/seo/nft-route-policy";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNftPageJsonLd } from "@/lib/structured-data/nft";
import { fetchUrl } from "@/services/6529api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type SearchParamValue = string | string[] | undefined;

type MemePageFetchResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false };

function isRequestedMemeNft(value: unknown, id: number): value is NFT {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as {
    readonly id?: unknown;
    readonly contract?: unknown;
  };
  return (
    candidate.id === id &&
    typeof candidate.contract === "string" &&
    candidate.contract.toLowerCase() === MEMES_CONTRACT.toLowerCase()
  );
}

function isRequestedMemeMetadata(
  value: unknown,
  id: number
): value is ApiMemesExtendedData {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { readonly id?: unknown }).id === id
  );
}

const fetchMemeNft = cache(
  async (id: string): Promise<MemePageFetchResult<NFT | undefined>> => {
    try {
      const params = new URLSearchParams({ contract: MEMES_CONTRACT, id });
      const response = await fetchUrl<DBResponse<NFT>>(
        `${publicEnv.API_ENDPOINT}/api/nfts?${params.toString()}`,
        { cache: "no-store" }
      );
      const data: unknown = response.data;
      if (!Array.isArray(data) || data.length > 1) return { ok: false };
      if (data.length === 0) return { ok: true, value: undefined };
      return isRequestedMemeNft(data[0], Number(id))
        ? { ok: true, value: data[0] }
        : { ok: false };
    } catch (error) {
      console.warn("Failed to fetch The Memes card data", { id, error });
      return { ok: false };
    }
  }
);

const fetchMemeMetadata = cache(
  async (id: string): Promise<MemePageFetchResult<ApiMemesExtendedData[]>> => {
    try {
      const response = await fetchUrl<DBResponse<ApiMemesExtendedData>>(
        `${publicEnv.API_ENDPOINT}/api/memes_extended_data?id=${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const data: unknown = response.data;
      if (!Array.isArray(data) || data.length > 1) return { ok: false };
      if (data.length === 0) return { ok: true, value: [] };
      return isRequestedMemeMetadata(data[0], Number(id))
        ? { ok: true, value: [data[0]] }
        : { ok: false };
    } catch (error) {
      console.warn("Failed to fetch The Memes card metadata", { id, error });
      return { ok: false };
    }
  }
);

type MemeRouteResolution =
  | {
      readonly kind: "published";
      readonly nft: NFT;
      readonly nftMeta: ApiMemesExtendedData;
    }
  | { readonly kind: "published-upcoming" }
  | { readonly kind: "missing" }
  | { readonly kind: "unavailable" };

function parseMemeId(id: string): number | null {
  return /^\d+$/u.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0
    ? Number(id)
    : null;
}

const resolveMemeRoute = cache(
  async (id: string): Promise<MemeRouteResolution> => {
    const numericId = parseMemeId(id);
    if (numericId === null) return { kind: "missing" };
    const [nftResult, metadataResult] = await Promise.all([
      fetchMemeNft(id),
      fetchMemeMetadata(id),
    ]);
    if (!nftResult.ok || !metadataResult.ok) return { kind: "unavailable" };
    const nft = nftResult.value;
    const nftMeta = metadataResult.value[0];
    if (nft && nftMeta && metadataResult.value.length === 1) {
      return { kind: "published", nft, nftMeta };
    }
    if (
      !nft &&
      metadataResult.value.length === 0 &&
      numericId === getCanonicalNextMintNumber()
    ) {
      return { kind: "published-upcoming" };
    }
    return !nft && metadataResult.value.length === 0
      ? { kind: "missing" }
      : { kind: "unavailable" };
  }
);

function getSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MemePage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolution = await resolveMemeRoute(id);
  if (resolution.kind === "missing") notFound();
  const nft = resolution.kind === "published" ? resolution.nft : null;
  let initialData;
  if (resolution.kind === "published") {
    initialData = {
      nft: resolution.nft,
      nftMeta: resolution.nftMeta,
      nftNotFound: false as const,
    };
  } else if (resolution.kind === "published-upcoming") {
    initialData = { nftNotFound: true as const };
  }

  return (
    <>
      {nft !== null ? (
        <JsonLdScript
          data={buildNftPageJsonLd({
            nft,
            path: `/the-memes/${id}`,
            fallbackName: `The Memes #${id}`,
            collectionName: "The Memes by 6529",
            collectionPath: "/the-memes",
          })}
        />
      ) : null}
      <MemePageComponent key={id} nftId={id} initialData={initialData} />
    </>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    focus?: SearchParamValue;
    locale?: SearchParamValue;
  }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { focus: rawFocus, locale: rawLocale } = await searchParams;
  const focus = getSearchParamValue(rawFocus);
  const locale = getSearchParamValue(rawLocale);
  const resolution = await resolveMemeRoute(id);
  if (resolution.kind === "missing") notFound();
  if (resolution.kind === "unavailable") {
    return getAppMetadata(
      {
        title: `The Memes #${id}`,
        description: "Artwork data is temporarily unavailable.",
      },
      {
        canonicalPath: getNftCanonicalPath({
          collection: "the-memes",
          id,
          requestedFocus: focus ?? null,
        }),
        robots: { index: false, follow: true },
      }
    );
  }
  const metadata = await getSharedAppServerSideProps(
    MEMES_CONTRACT,
    id,
    focus ?? "",
    false,
    normalizeLocale(locale),
    resolution.kind === "published" ? resolution.nft : null
  );
  return metadata;
}
