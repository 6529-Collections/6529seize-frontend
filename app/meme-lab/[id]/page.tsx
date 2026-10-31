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
import { MEMELAB_CONTRACT } from "@/constants/constants";
import { getNftCanonicalPath } from "@/helpers/seo/nft-route-policy";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNftPageJsonLd } from "@/lib/structured-data/nft";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { resolveMemeLabRoute } from "./memeLabRouteResolution";

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
    <main className={styles["main"]} lang={locale}>
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
