import MemePageComponent from "@/components/the-memes/MemePage";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { getAppMetadata } from "@/components/providers/metadata";
import { MEMES_CONTRACT } from "@/constants/constants";
import { normalizeLocale } from "@/i18n/locales";
import { getNftCanonicalPath } from "@/helpers/seo/nft-route-policy";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNftPageJsonLd } from "@/lib/structured-data/nft";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveMemeRoute } from "./memeRouteResolution";

type SearchParamValue = string | string[] | undefined;

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
