import MemePageComponent from "@/components/the-memes/MemePage";
import {
  getSharedAppServerSideProps,
  isMemeFocus,
  MEME_FOCUS,
} from "@/components/the-memes/MemeShared";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import { normalizeLocale } from "@/i18n/locales";
import JsonLdScript from "@/lib/structured-data/json-ld";
import {
  buildNftPageJsonLd,
  fetchNftForStructuredData,
} from "@/lib/structured-data/nft";
import type { Metadata } from "next";

type SearchParamValue = string | string[] | undefined;

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
  const nft = await fetchNftForStructuredData({
    contract: MEMES_CONTRACT,
    id,
  });

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
      <MemePageComponent nftId={id} />
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
  const metadata = await getSharedAppServerSideProps(
    MEMES_CONTRACT,
    id,
    focus ?? "",
    false,
    normalizeLocale(locale)
  );

  return {
    ...metadata,
    alternates: {
      ...(metadata.alternates ?? {}),
      canonical: getMemePageCanonicalUrl(id, focus),
    },
  };
}
