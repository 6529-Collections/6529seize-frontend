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
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { canonicalUrl } from "@/lib/structured-data/utils";
import { buildNextgenTokenPageJsonLd } from "@/lib/structured-data/nextgen";
import { NextgenCollectionView } from "@/types/enums";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNextgenTitle } from "../../../title-utils";
import NextGenTokenPageClient from "./NextGenTokenPageClient";
import { fetchTokenData, getContentView } from "./page-utils";

const isUsableImageSource = (
  source: string | null | undefined
): source is string =>
  source !== null && source !== undefined && source.trim().length > 0;

const getFirstUsableImage = (
  ...sources: readonly (string | null | undefined)[]
): string | undefined => sources.find(isUsableImageSource);

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ token: string; view?: string[] | undefined }>;
}): Promise<Metadata> {
  const { token, view } = await params;
  const headers = await getAppCommonHeaders();
  const data = await fetchTokenData(token, headers);
  if (!data) {
    return getAppMetadata(
      getLargeSocialCardMetadata({
        title: "NextGen Token",
        description: "NextGen",
        ogImage: getNftSocialCardImagePath({
          badge: "NextGen",
          collection: "NextGen",
          contract: NEXTGEN_CONTRACT,
          id: token,
          subtitle: "NextGen",
          title: `NextGen #${token}`,
        }),
        ogImageAlt: "NextGen Token social card",
      })
    );
  }
  const resolvedView = getContentView(view?.[0] ?? "");
  const viewDisplay =
    resolvedView !== NextgenCollectionView.ABOUT ? resolvedView : "";
  const displayId = data.token?.normalised_id;
  const baseTitle =
    data.token?.name ?? `${data.collection.name} - #${data.tokenId}`;
  const title = getNextgenTitle(viewDisplay, baseTitle);
  const description = [baseTitle, data.collection.artist.trim(), "NextGen"]
    .filter(Boolean)
    .join(" · ");
  const viewPath =
    viewDisplay.length > 0
      ? `/${viewDisplay.toLowerCase().replaceAll(" ", "-")}`
      : "";
  const canonical = canonicalUrl(
    `/nextgen/token/${data.token?.id ?? data.tokenId}${viewPath}`
  );
  const metadata = getAppMetadata(
    getLargeSocialCardMetadata({
      title,
      description,
      ogImage: getNftSocialCardImagePath({
        artist: data.collection.artist,
        badge: "NextGen",
        collection: data.collection.name,
        contract: NEXTGEN_CONTRACT,
        displayId,
        id: data.token?.id ?? data.tokenId,
        image: getFirstUsableImage(
          data.token?.image_url,
          data.token?.thumbnail_url,
          data.collection.banner,
          data.collection.image
        ),
        title,
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
  const headers = await getAppCommonHeaders();
  const data = await fetchTokenData(token, headers);
  if (!data) {
    notFound();
  }
  const resolvedView = getContentView(view?.[0] ?? "");
  const viewPath =
    resolvedView === NextgenCollectionView.ABOUT ? "" : `/${resolvedView}`;
  const path = `/nextgen/token/${token}${viewPath}`;
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
