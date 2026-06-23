import type { Metadata } from "next";

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

  return await renderWavesPageContent({
    waveId: wave,
    searchParams: resolvedParams,
    routeContext: "waves",
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
