import { redirect } from "next/navigation";


import { getWavePathRoute } from "@/helpers/navigation.helpers";

import {
  buildWavesMetadata,
  getFirstSearchParamValue,
  renderWavesPageContent,
  type WavesSearchParams,
} from "./waves-page.shared";

import type { Metadata } from "next";

const buildLegacyWaveRedirect = (
  waveId: string,
  searchParams: WavesSearchParams
): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "wave" || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  const queryString = params.toString();
  const canonicalPath = getWavePathRoute(waveId);
  return queryString ? `${canonicalPath}?${queryString}` : canonicalPath;
};

export default async function WavesPage({
  searchParams,
}: {
  readonly searchParams: Promise<WavesSearchParams>;
}) {
  const resolvedParams = await searchParams;
  const legacyWaveId = getFirstSearchParamValue(resolvedParams, "wave");

  if (legacyWaveId) {
    redirect(buildLegacyWaveRedirect(legacyWaveId, resolvedParams));
  }

  return await renderWavesPageContent({
    waveId: null,
    searchParams: resolvedParams,
  });
}

export async function generateMetadata({
  searchParams,
}: {
  readonly searchParams: Promise<WavesSearchParams>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const waveId = getFirstSearchParamValue(resolvedParams, "wave");
  return await buildWavesMetadata(waveId);
}
