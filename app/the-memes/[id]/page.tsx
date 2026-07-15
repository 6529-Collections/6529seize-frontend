import MemePageComponent from "@/components/the-memes/MemePage";
import {
  getSharedAppServerSideProps,
  isMemeFocus,
  MEME_FOCUS,
} from "@/components/the-memes/MemeShared";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { normalizeLocale } from "@/i18n/locales";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNftPageJsonLd } from "@/lib/structured-data/nft";
import { fetchUrl } from "@/services/6529api";
import type { Metadata } from "next";
import { cache } from "react";

type SearchParamValue = string | string[] | undefined;

type MemePageFetchResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false };

const fetchMemeNft = cache(
  async (id: string): Promise<MemePageFetchResult<NFT | undefined>> => {
    try {
      const params = new URLSearchParams({ contract: MEMES_CONTRACT, id });
      const response = await fetchUrl<DBResponse<NFT>>(
        `${publicEnv.API_ENDPOINT}/api/nfts?${params.toString()}`,
        { cache: "no-store" }
      );
      return { ok: true, value: response.data[0] };
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
      return {
        ok: true,
        value: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      console.warn("Failed to fetch The Memes card metadata", { id, error });
      return { ok: false };
    }
  }
);

function getInitialMemePageData(
  nftResult: MemePageFetchResult<NFT | undefined>,
  metadataResult: MemePageFetchResult<ApiMemesExtendedData[]>
) {
  if (!nftResult.ok || !metadataResult.ok) {
    return undefined;
  }

  if (metadataResult.value.length !== 1) {
    return { nftNotFound: true } as const;
  }

  return {
    nft: nftResult.value,
    nftMeta: metadataResult.value[0],
    nftNotFound: false,
  } as const;
}

function getSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getMemePageCanonicalUrl(
  id: string,
  focus: string | undefined
): string {
  const canonicalUrl = new URL(
    `/the-memes/${encodeURIComponent(id)}`,
    publicEnv.BASE_ENDPOINT
  );

  // Locale is fallback-only today, but non-default focus tabs render distinct primary content.
  if (focus && focus !== MEME_FOCUS.LIVE && isMemeFocus(focus)) {
    canonicalUrl.searchParams.set("focus", focus);
  }

  return canonicalUrl.toString();
}

export default async function MemePage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [nftResult, metadataResult] = await Promise.all([
    fetchMemeNft(id),
    fetchMemeMetadata(id),
  ]);
  const nft = nftResult.ok ? (nftResult.value ?? null) : null;
  const initialData = getInitialMemePageData(nftResult, metadataResult);

  return (
    <>
      <JsonLdScript
        data={buildNftPageJsonLd({
          nft,
          path: `/the-memes/${id}`,
          fallbackName: `The Memes #${id}`,
          collectionName: "The Memes by 6529",
          collectionPath: "/the-memes",
        })}
      />
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
  const nftResult = await fetchMemeNft(id);
  const metadata = await getSharedAppServerSideProps(
    MEMES_CONTRACT,
    id,
    focus ?? "",
    false,
    normalizeLocale(locale),
    nftResult.ok ? (nftResult.value ?? null) : undefined
  );

  return {
    ...metadata,
    alternates: {
      ...(metadata.alternates ?? {}),
      canonical: getMemePageCanonicalUrl(id, focus),
    },
  };
}
