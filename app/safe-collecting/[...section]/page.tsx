import { getAppMetadata } from "@/components/providers/metadata";
import {
  getDelegationAppTitle,
  getDelegationRouteMetadata,
  getWalletCheckerCanonicalPath,
} from "@/components/delegation/delegation-page-metadata";
import { DelegationCenterSection } from "@/types/enums";
import type { Metadata } from "next";
import DelegationPageClient from "@/app/delegation/[...section]/page.client";
import {
  normalizeSafeCollectingSegments,
  getSafeCollectingArticlePath,
} from "@/components/delegation/safe-collecting-routes";

export default async function DelegationPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ section: string[] }>;
  readonly searchParams: Promise<{
    address?: string | undefined;
    collection?: string | undefined;
    use_case?: string | undefined;
  }>;
}) {
  const { section } = await params;
  const { address = "", collection = "", use_case } = await searchParams;
  const sectionPath = normalizeSafeCollectingSegments(section);
  const mySection = sectionPath.length > 1 ? sectionPath : sectionPath[0];
  const useCaseQuery = use_case ? Number.parseInt(use_case) || 0 : 0;

  if (
    typeof mySection === "string" &&
    mySection.length > 0 &&
    Object.values(DelegationCenterSection).includes(
      mySection as DelegationCenterSection
    )
  ) {
    const resolvedSection = mySection as DelegationCenterSection;
    return (
      <DelegationPageClient
        section={resolvedSection}
        addressQuery={address}
        collectionQuery={collection}
        useCaseQuery={useCaseQuery}
        path={sectionPath}
      />
    );
  }

  return (
    <DelegationPageClient
      section={DelegationCenterSection.HTML}
      path={sectionPath}
      addressQuery={address}
      collectionQuery={collection}
      useCaseQuery={useCaseQuery}
    />
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  readonly params: Promise<{ section: string[] }>;
  readonly searchParams?: Promise<{
    readonly [key: string]: string | string[] | undefined;
  }>;
}): Promise<Metadata> {
  const { section } = await params;
  const metadata = getDelegationRouteMetadata(
    normalizeSafeCollectingSegments(section)
  );

  const canonicalPath =
    section.length === 1 && section[0] === DelegationCenterSection.CHECKER
      ? getWalletCheckerCanonicalPath((await searchParams)?.["address"])
      : getSafeCollectingArticlePath(section);

  return getAppMetadata(
    {
      title: getDelegationAppTitle(metadata),
      description: metadata.description,
    },
    { canonicalPath }
  );
}
