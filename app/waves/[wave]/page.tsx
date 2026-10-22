import type { Metadata } from "next";
import { headers } from "next/headers";

import {
  buildWavesMetadata,
  renderWavesPageContent,
  type WavesSearchParams,
} from "../waves-page.shared";

export default async function WavePage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ wave: string }>;
  readonly searchParams: Promise<WavesSearchParams>;
}) {
  const { wave } = await params;
  const resolvedParams = await searchParams;
  const requestHeaders = await headers();

  return await renderWavesPageContent({
    waveId: wave,
    searchParams: resolvedParams,
    routeContext: "waves",
    // Browser fetches already have an interactive shell. Keep the anonymous
    // preview for document loads and crawlers. Next hides internal RSC headers.
    includePublicPreview: requestHeaders.get("sec-fetch-dest") !== "empty",
  });
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  readonly params: Promise<{ wave: string }>;
  readonly searchParams: Promise<WavesSearchParams>;
}): Promise<Metadata> {
  const { wave } = await params;
  const resolvedParams = await searchParams;
  return await buildWavesMetadata(wave, resolvedParams);
}
