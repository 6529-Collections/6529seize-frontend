import DelegationPageClient from "@/app/delegation/[...section]/page.client";
import {
  getDelegationAppTitle,
  getDelegationRouteMetadata,
} from "@/components/delegation/delegation-page-metadata";
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
  const collection =
    typeof query["collection"] === "string" ? query["collection"] : "";
  const useCase =
    typeof query["use_case"] === "string"
      ? Number.parseInt(query["use_case"], 10) || 0
      : 0;

  return (
    <DelegationPageClient
      section={DelegationCenterSection.CENTER}
      addressQuery={address}
      collectionQuery={collection}
      useCaseQuery={useCase}
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
