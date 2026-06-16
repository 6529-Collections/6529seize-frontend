import styles from "@/styles/Home.module.scss";

import MemeLabPageComponent from "@/components/memelab/MemeLabPage";
import {
  getMemeLabRouteLocale,
  getSearchParamValue,
  type MemeLabDetailSearchParams,
} from "@/components/memelab/memeLabRouteParams";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MemePageSkeleton } from "@/components/the-memes/MemePageSkeleton";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { Metadata } from "next";
import { Suspense } from "react";

export default async function MemeLabPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ id: string }>;
  readonly searchParams?: Promise<MemeLabDetailSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const locale = getMemeLabRouteLocale(resolvedSearchParams);

  return (
    <main className={styles["main"]}>
      <Suspense fallback={<MemePageSkeleton />}>
        <MemeLabPageComponent nftId={id} locale={locale} />
      </Suspense>
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<MemeLabDetailSearchParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const focus = getSearchParamValue(resolvedSearchParams.focus) ?? "";
  const locale = getMemeLabRouteLocale(resolvedSearchParams);

  return getSharedAppServerSideProps(
    MEMELAB_CONTRACT,
    id,
    focus,
    false,
    locale
  );
}
