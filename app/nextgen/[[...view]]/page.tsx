// app/nextgen/[[...view]]/page.tsx
import { NextGenCollection } from "@/entities/INextgen";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import type { Metadata } from "next";
import NextGenPageClient from "./NextGenPageClient";
import { getNextGenView } from "./view-utils";

async function fetchFeaturedNextGenCollection(
  headers: Record<string, string>
): Promise<NextGenCollection> {
  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: "nextgen/featured",
    headers: headers,
  });
  return collection;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}): Promise<Metadata> {
  console.log("params", params);
  const { view } = await params;
  console.log("view", view);
  const nextgenView = getNextGenView(view?.[0] ?? "");
  console.log("nextgenView", nextgenView);
  return {
    title: "NextGen " + (nextgenView ?? ""),
    openGraph: { images: [`${process.env.BASE_ENDPOINT}/nextgen.png`] },
    description: "NextGen",
    twitter: { card: "summary_large_image" },
  };
}

export default async function NextGenPage({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}) {
  const headers = await getAppCommonHeaders();
  const collection = await fetchFeaturedNextGenCollection(headers);
  const { view } = await params;
  const nextgenView = getNextGenView(view?.[0] ?? "") ?? undefined;

  return (
    <NextGenPageClient
      initialCollection={collection}
      initialView={nextgenView}
    />
  );
}
