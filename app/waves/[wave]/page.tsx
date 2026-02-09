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
  });
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ wave: string }>;
}): Promise<Metadata> {
  const { wave } = await params;
  return await buildWavesMetadata(wave);
}
