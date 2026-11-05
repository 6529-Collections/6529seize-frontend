import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import { NEXTGEN_CONTRACT } from "@/constants/constants";
import {
  getProfileCollectedReturnContext,
  PROFILE_COLLECTED_RETURN_PARAM,
} from "@/helpers/profile-collected-navigation";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { canonicalUrl } from "@/lib/structured-data/utils";
import { buildNextgenTokenPageJsonLd } from "@/lib/structured-data/nextgen";
import { NextgenCollectionView } from "@/types/enums";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNextgenTitle } from "../../../title-utils";
import NextGenTokenPageClient from "./NextGenTokenPageClient";
import { fetchTokenData, getContentView } from "./page-utils";
import { getNextgenTokenViewSegment } from "@/components/nextGen/collections/nextgenToken/nextgen-token-view.helpers";
import { getNextgenRequestHeaders } from "@/app/nextgen/request-headers";

const getTokenPath = (tokenId: number, view: NextgenCollectionView): string => {
  const viewSegment = getNextgenTokenViewSegment(view);
  const viewPath = viewSegment ? `/${viewSegment}` : "";
  return `/nextgen/token/${tokenId}${viewPath}`;
};

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ token: string; view?: string[] | undefined }>;
}): Promise<Metadata> {
  const { token, view } = await params;
  const headers = await getNextgenRequestHeaders();
  const data = await fetchTokenData(token, headers);
  if (!data) {
    return getAppMetadata(
      getLargeSocialCardMetadata({
        title: "NextGen Token",
        description: "NextGen",
        ogImage: getNftSocialCardImagePath({
          contract: NEXTGEN_CONTRACT,
          id: token,
        }),
        ogImageAlt: "NextGen Token social card",
      })
    );
  }
  const resolvedView = getContentView(view?.[0] ?? "");
  const viewDisplay =
    resolvedView !== NextgenCollectionView.ABOUT ? resolvedView : "";
  const baseTitle =
    data.token?.name ?? `${data.collection.name} - #${data.tokenId}`;
  const title = getNextgenTitle(viewDisplay, baseTitle);
  const description = [baseTitle, data.collection.artist.trim(), "NextGen"]
    .filter(Boolean)
    .join(" · ");
  const canonical = canonicalUrl(
    getTokenPath(data.token?.id ?? data.tokenId, resolvedView)
  );
  const metadata = getAppMetadata(
    getLargeSocialCardMetadata({
      title,
      description,
      ogImage: getNftSocialCardImagePath({
        contract: NEXTGEN_CONTRACT,
        id: data.token?.id ?? data.tokenId,
      }),
      ogImageAlt: `${title} social card`,
    })
  );
  return {
    ...metadata,
    alternates: { canonical },
    openGraph: { ...metadata.openGraph, url: canonical },
  };
}

export default async function NextGenTokenPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ token: string; view?: string[] | undefined }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token, view } = await params;
  const resolvedSearchParams = await searchParams;
  const rawReturnTo = resolvedSearchParams[PROFILE_COLLECTED_RETURN_PARAM];
  const returnToValue = Array.isArray(rawReturnTo)
    ? rawReturnTo[0]
    : rawReturnTo;
  const returnTo =
    getProfileCollectedReturnContext(returnToValue)?.href ?? null;
  const headers = await getNextgenRequestHeaders();
  const data = await fetchTokenData(token, headers);
  if (!data) {
    notFound();
  }
  const resolvedView = getContentView(view?.[0] ?? "");
  const path = getTokenPath(data.token?.id ?? data.tokenId, resolvedView);
  return (
    <>
      <JsonLdScript
        data={buildNextgenTokenPageJsonLd({
          collection: data.collection,
          token: data.token,
          tokenId: data.tokenId,
          traits: data.traits,
          path,
        })}
      />
      <NextGenTokenPageClient
        tokenId={data.tokenId}
        token={data.token}
        traits={data.traits}
        tokenCount={data.tokenCount}
        collection={data.collection}
        view={resolvedView}
        returnTo={returnTo}
      />
    </>
  );
}
