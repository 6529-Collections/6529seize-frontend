import MemePageComponent from "@/components/the-memes/MemePage";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "@/constants/constants";
import { normalizeLocale } from "@/i18n/locales";
import type { Metadata } from "next";

export default async function MemePage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemePageComponent nftId={id} />;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string; locale?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { focus, locale } = await searchParams;
  return getSharedAppServerSideProps(
    MEMES_CONTRACT,
    id,
    focus ?? "",
    false,
    normalizeLocale(locale)
  );
}
