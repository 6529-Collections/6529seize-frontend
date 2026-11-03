import DelegationPageClient from "@/app/delegation/[...section]/page.client";
import {
  getDelegationAppTitle,
  getDelegationRouteMetadata,
} from "@/components/delegation/delegation-page-metadata";
import { parseDelegationFormPresets } from "@/components/delegation/delegation-options";
import { getAppMetadata } from "@/components/providers/metadata";
import { DelegationCenterSection } from "@/types/enums";
import type { Metadata } from "next";

export default async function SafeCollectingPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly [key: string]: string | string[] | undefined;
  }>;
}) {
  const query = await searchParams;
  const address = typeof query["address"] === "string" ? query["address"] : "";
  const { collectionQuery, useCaseQuery } = parseDelegationFormPresets({
    collection: query["collection"],
    use_case: query["use_case"],
  });

  return (
    <DelegationPageClient
      section={DelegationCenterSection.CENTER}
      addressQuery={address}
      collectionQuery={collectionQuery}
      useCaseQuery={useCaseQuery}
    />
  );
}

export function generateMetadata(): Metadata {
  const metadata = getDelegationRouteMetadata([DelegationCenterSection.CENTER]);
  return getAppMetadata(
    {
      title: getDelegationAppTitle(metadata),
      description: metadata.description,
    },
    { canonicalPath: "/safe-collecting" }
  );
}
