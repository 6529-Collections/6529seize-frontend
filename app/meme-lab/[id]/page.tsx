import styles from "@/styles/Home.module.css";

import MemeLabPageComponent from "@/components/memelab/MemeLabPage";
import {
  getMemeLabRouteLocale,
  getSearchParamValue,
  type MemeLabDetailSearchParams,
} from "@/components/memelab/memeLabRouteParams";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MemePageSkeleton } from "@/components/the-memes/MemePageSkeleton";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { BaseNFT } from "@/entities/INFT";
import { getNftCanonicalPath } from "@/helpers/seo/nft-route-policy";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNftPageJsonLd } from "@/lib/structured-data/nft";
import { fetchUrl } from "@/services/6529api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";

type MemeLabRouteResolution =
  | { readonly kind: "published"; readonly nft: BaseNFT }
  | { readonly kind: "missing" }
  | { readonly kind: "unavailable" };

const resolveMemeLabRoute = cache(
  async (id: string): Promise<MemeLabRouteResolution> => {
    const numericId = Number(id);
    if (
      !/^\d+$/u.test(id) ||
      !Number.isSafeInteger(numericId) ||
      numericId < 1
    ) {
      return { kind: "missing" };
    }

    try {
      const params = new URLSearchParams({ contract: MEMELAB_CONTRACT, id });
      const response = await fetchUrl<DBResponse<BaseNFT>>(
        `${publicEnv.API_ENDPOINT}/api/nfts_memelab?${params.toString()}`,
        { cache: "no-store" }
      );
      if (!Array.isArray(response.data)) {
        return { kind: "unavailable" };
      }
      if (response.data.length === 0) {
        return { kind: "missing" };
      }
      const nft = response.data[0];
      if (
        response.data.length !== 1 ||
        nft?.id !== numericId ||
        typeof nft.contract !== "string"
      ) {
        return { kind: "unavailable" };
      }
      return { kind: "published", nft };
    } catch (error) {
      console.warn("Failed to resolve Meme Lab card", { id, error });
      return { kind: "unavailable" };
    }
  }
);

export default async function MemeLabPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ id: string }>;
  readonly searchParams?: Promise<MemeLabDetailSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const locale = getMemeLabRouteLocale(resolvedSearchParams);
  const resolution = await resolveMemeLabRoute(id);
  if (resolution.kind === "missing") {
    notFound();
  }

  return (
    <main className={styles["main"]}>
      {resolution.kind === "published" ? (
        <JsonLdScript
          data={buildNftPageJsonLd({
            nft: resolution.nft,
            path: `/meme-lab/${id}`,
            fallbackName: `Meme Lab #${id}`,
            collectionName: "Meme Lab",
            collectionPath: "/meme-lab",
          })}
        />
      ) : null}
      <Suspense fallback={<MemePageSkeleton />}>
        <MemeLabPageComponent nftId={id} locale={locale} />
      </Suspense>
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<MemeLabDetailSearchParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const focus = getSearchParamValue(resolvedSearchParams.focus) ?? "";
  const locale = getMemeLabRouteLocale(resolvedSearchParams);
  const resolution = await resolveMemeLabRoute(id);
  if (resolution.kind === "missing") {
    notFound();
  }
  if (resolution.kind === "unavailable") {
    return getAppMetadata(
      {
        title: `Meme Lab #${id}`,
        description: "Artwork data is temporarily unavailable.",
      },
      {
        canonicalPath: getNftCanonicalPath({
          collection: "meme-lab",
          id,
          requestedFocus: focus,
        }),
        robots: { index: false, follow: true },
      }
    );
  }

  return getSharedAppServerSideProps(
    MEMELAB_CONTRACT,
    id,
    focus,
    false,
    locale,
    resolution.nft
  );
}
