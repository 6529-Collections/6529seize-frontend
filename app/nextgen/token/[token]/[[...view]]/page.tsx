import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import { NEXTGEN_CONTRACT } from "@/constants/constants";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { NextgenCollectionView } from "@/types/enums";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NextGenTokenPageClient from "./NextGenTokenPageClient";
import { fetchTokenData, getContentView } from "./page-utils";

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
  const baseTitle =
    data.token?.name ?? `${data.collection.name} - #${data.tokenId}`;
  const title = viewDisplay ? `${baseTitle} | ${viewDisplay}` : baseTitle;
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title,
      description: "NextGen",
      ogImage: getNftSocialCardImagePath({
        artist: data.collection.artist,
        badge: "NextGen",
        collection: data.collection.name,
        contract: NEXTGEN_CONTRACT,
        id: data.tokenId,
        image:
          data.token?.thumbnail_url ||
          data.token?.image_url ||
          data.collection.banner ||
          data.collection.image,
        subtitle: `${data.collection.name} #${data.tokenId} | NextGen`,
        title,
      }),
      ogImageAlt: `${title} social card`,
    })
  );
}

export default async function NextGenTokenPage({
  params,
}: {
  readonly params: Promise<{ token: string; view?: string[] | undefined }>;
}) {
  const { token, view } = await params;
  const headers = await getAppCommonHeaders();
  const data = await fetchTokenData(token, headers);
  if (!data) {
    notFound();
  }
  const resolvedView = getContentView(view?.[0] ?? "");
  return (
    <NextGenTokenPageClient
      tokenId={data.tokenId}
      token={data.token}
      traits={data.traits}
      tokenCount={data.tokenCount}
      collection={data.collection}
      view={resolvedView}
    />
  );
}
