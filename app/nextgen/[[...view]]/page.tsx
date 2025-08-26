import { getAppMetadata } from "@/components/providers/metadata";
import { NextGenCollection } from "@/entities/INextgen";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import type { Metadata } from "next";
import NextGenPageClient from "./NextGenPageClient";
import { getNextGenView } from "./view-utils";

async function fetchFeaturedNextGenCollection(
  headers: Record<string, string>
): Promise<NextGenCollection> {
  return await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/featured`,
    headers: headers,
  });
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ view?: string[] }>;
}): Promise<Metadata> {
  const { view } = await params;
  const nextgenView = getNextGenView(view?.[0] ?? "");
  return getAppMetadata({ title: "NextGen " + (nextgenView ?? "") });
}

export default async function NextGenPage({
  params,
}: {
  readonly params: Promise<{ view?: string[] }>;
}) {
  const headers = await getAppCommonHeaders();
  const featuredCollection = await fetchFeaturedNextGenCollection(headers);

  const { view } = await params;
  const nextgenView = getNextGenView(view?.[0] ?? "");

  return (
    <NextGenPageClient
      featuredCollection={featuredCollection}
      initialView={nextgenView}
    />
  );
}
