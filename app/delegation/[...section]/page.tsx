import { getAppMetadata } from "@/components/providers/metadata";
import { DelegationCenterSection } from "@/enums";
import type { Metadata } from "next";
import DelegationPageClient from "./page.client";

export default async function DelegationPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ section: string[] }>;
  readonly searchParams: Promise<{
    address?: string;
    collection?: string;
    use_case?: string;
  }>;
}) {
  const { section } = await params;
  const { address = "", collection = "", use_case } = await searchParams;
  const sectionPath = section;
  const mySection = sectionPath.length > 1 ? sectionPath : sectionPath[0];
  const useCaseQuery = use_case ? parseInt(use_case) || 0 : 0;

  if (
    mySection &&
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
}: {
  readonly params: Promise<{ section: string[] }>;
}): Promise<Metadata> {
  const { section } = await params;
  const sectionPath = section;
  const mySection = sectionPath.length > 1 ? sectionPath : sectionPath[0];

  if (
    mySection &&
    Object.values(DelegationCenterSection).includes(
      mySection as DelegationCenterSection
    )
  ) {
    const title = (mySection as string)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return getAppMetadata({
      title,
      description: "NFT Delegation",
    });
  }

  return getAppMetadata({ title: "Delegation", description: "NFT Delegation" });
}
