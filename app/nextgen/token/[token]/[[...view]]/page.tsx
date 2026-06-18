import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNextgenTokenPageJsonLd } from "@/lib/structured-data/nextgen";
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
    return getAppMetadata({ title: "NextGen Token" });
  }
  const resolvedView = getContentView(view?.[0] ?? "");
  const viewDisplay =
    resolvedView !== NextgenCollectionView.ABOUT ? resolvedView : "";
  const baseTitle =
    data.token?.name ?? `${data.collection.name} - #${data.tokenId}`;
  const title = viewDisplay ? `${baseTitle} | ${viewDisplay}` : baseTitle;
  return getAppMetadata({
    title,
    ogImage:
      data.token?.thumbnail_url ||
      data.token?.image_url ||
      data.collection.banner ||
      `${publicEnv.BASE_ENDPOINT}/nextgen.png`,
    description: "NextGen",
  });
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
      />
    </>
  );
}
