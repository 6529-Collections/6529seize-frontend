import NextGenTokenPageClient from "./NextGenTokenPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { fetchTokenData, getContentView } from "./page-utils";
import { notFound } from "next/navigation";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";

export async function generateMetadata({
  params,
}: {
  params: { token: string; view?: string[] };
}): Promise<Metadata> {
  const data = await fetchTokenData(params.token);
  if (!data) {
    return getAppMetadata({ title: "NextGen Token" });
  }
  const view = getContentView(params.view?.[0] ?? "");
  const viewDisplay = view !== ContentView.ABOUT ? view : "";
  const baseTitle = data.token?.name ?? `${data.collection.name} - #${data.tokenId}`;
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
  params: { token: string; view?: string[] };
}) {
  const data = await fetchTokenData(params.token);
  if (!data) {
    notFound();
  }
  const view = getContentView(params.view?.[0] ?? "");
  return (
    <NextGenTokenPageClient
      tokenId={data.tokenId}
      token={data.token}
      traits={data.traits}
      tokenCount={data.tokenCount}
      collection={data.collection}
      view={view}
    />
  );
}
