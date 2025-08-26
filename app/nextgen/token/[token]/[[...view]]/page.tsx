import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NextGenTokenPageClient from "./NextGenTokenPageClient";
import { fetchTokenData, getContentView } from "./page-utils";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ token: string; view?: string[] }>;
}): Promise<Metadata> {
  const { token, view } = await params;
  const data = await fetchTokenData(token);
  if (!data) {
    return getAppMetadata({ title: "NextGen Token" });
  }
  const resolvedView = getContentView(view?.[0] ?? "");
  const viewDisplay = resolvedView !== ContentView.ABOUT ? resolvedView : "";
  const baseTitle =
    data.token?.name ?? `${data.collection.name} - #${data.tokenId}`;
  const title = viewDisplay ? `${baseTitle} | ${viewDisplay}` : baseTitle;
  return getAppMetadata({
    title,
    ogImage:
      data.token?.thumbnail_url ||
      data.token?.image_url ||
      data.collection.banner ||
      `${process.env.BASE_ENDPOINT}/nextgen.png`,
    description: "NextGen",
  });
}

export default async function Page({
  params,
}: {
  readonly params: Promise<{ token: string; view?: string[] }>;
}) {
  const { token, view } = await params;
  const data = await fetchTokenData(token);
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
