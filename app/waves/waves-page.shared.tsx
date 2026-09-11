import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getAppMetadata,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import WavesPageClient from "./page.client";
import { fetchServerWaveFeedSeed } from "./wave-feed-seed.server";
import WaveServerFeedSeed, {
  WaveServerFeedSeedGate,
} from "@/components/waves/WaveServerFeedSeed";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { getWaveQueryKey } from "@/services/api/wave-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiOgMetadata } from "@/generated/models/ApiOgMetadata";
import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { formatAddress } from "@/helpers/Helpers";
import {
  getWaveRouteWithSearchParams,
  type RouteSearchParams,
} from "@/helpers/navigation.helpers";
import JsonLdScript from "@/lib/structured-data/json-ld";
import {
  buildWavePageJsonLd,
  buildWavesIndexPageJsonLd,
} from "@/lib/structured-data/waves";
import {
  getServerRouteAuthCohort,
  SERVER_ROUTE_SPAN_NAMES,
  traceServerRouteData,
} from "@/utils/monitoring/serverRouteTelemetry";

export type WavesSearchParams = RouteSearchParams;

type WaveRequestContext = {
  readonly waveId: string | null;
  readonly wave: ApiWave | null;
  readonly headers: Record<string, string>;
};

type WaveFetchResult =
  | { readonly ok: true; readonly wave: ApiWave | null }
  | { readonly ok: false; readonly error: unknown };

type WaveRequestContextResult = {
  readonly context: WaveRequestContext;
  readonly fetchResult: WaveFetchResult;
};

export const getFirstSearchParamValue = (
  searchParams: WavesSearchParams,
  key: string
): string | null => {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === "string" ? value : null;
};

const getStructuredDataDropParam = (
  searchParams: WavesSearchParams
): { key: "serialNo" | "drop"; value: string } | null => {
  const serialNo = getFirstSearchParamValue(searchParams, "serialNo")?.trim();
  if (serialNo) {
    return { key: "serialNo", value: serialNo };
  }

  const drop = getFirstSearchParamValue(searchParams, "drop")?.trim();
  if (drop) {
    return { key: "drop", value: drop };
  }

  return null;
};

const getDropMetadataId = (searchParams: WavesSearchParams): string | null =>
  getStructuredDataDropParam(searchParams)?.value ?? null;

const buildWaveStructuredDataPath = ({
  waveId,
  searchParams,
}: {
  readonly waveId: string | null;
  readonly searchParams: WavesSearchParams;
}): string => {
  if (waveId === null) {
    return "/waves";
  }

  const params = new URLSearchParams();
  const dropParam = getStructuredDataDropParam(searchParams);

  if (dropParam) {
    params.set(dropParam.key, dropParam.value);
  }

  const queryString = params.toString();
  const path = `/waves/${encodeURIComponent(waveId)}`;
  return queryString ? `${path}?${queryString}` : path;
};

const fetchWaveCached = cache(
  async (
    waveId: string | null,
    headersKey: string
  ): Promise<WaveFetchResult> => {
    if (waveId === null) {
      return { ok: true, wave: null };
    }
    let headers: Record<string, string> = {};
    try {
      headers = headersKey
        ? (JSON.parse(headersKey) as Record<string, string>)
        : {};
    } catch {
      headers = {};
    }
    try {
      return {
        ok: true,
        wave: await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
          headers,
        }),
      };
    } catch (error) {
      console.warn("Failed to fetch wave", { waveId, error });
      return { ok: false, error };
    }
  }
);

const fetchDropOgMetadataCached = cache(
  async (dropId: string, headersKey: string): Promise<ApiOgMetadata | null> => {
    const normalizedDropId = dropId.trim();
    const encodedDropId = encodeURIComponent(normalizedDropId);
    let headers: Record<string, string> = {};
    try {
      headers = headersKey
        ? (JSON.parse(headersKey) as Record<string, string>)
        : {};
    } catch {
      headers = {};
    }
    try {
      return await commonApiFetch<ApiOgMetadata>({
        endpoint: `og-metadata/drops/${encodedDropId}`,
        headers,
      });
    } catch (error) {
      console.warn("Failed to fetch drop OG metadata", {
        dropId: normalizedDropId,
        error,
      });
      return null;
    }
  }
);

export const isApiWaveDirectMessage = (wave: ApiWave): boolean =>
  wave.chat?.scope?.group?.is_direct_message === true;

async function fetchWaveContextResult(
  waveId: string | null,
  providedHeaders?: Record<string, string>
): Promise<WaveRequestContextResult> {
  const headers = providedHeaders ?? (await getAppCommonHeaders());
  const headersKey = JSON.stringify(headers);
  const fetchResult = await fetchWaveCached(waveId, headersKey);

  return {
    context: {
      waveId,
      wave: fetchResult.ok ? fetchResult.wave : null,
      headers,
    },
    fetchResult,
  };
}

export async function fetchWaveContext(
  waveId: string | null,
  providedHeaders?: Record<string, string>
): Promise<WaveRequestContext> {
  const result = await fetchWaveContextResult(waveId, providedHeaders);
  return result.context;
}

export async function renderWavesPageContent({
  waveId,
  searchParams,
  routeContext = "waves",
}: {
  waveId: string | null;
  searchParams: WavesSearchParams;
  routeContext?: "waves" | "messages" | undefined;
}) {
  if (waveId === null) {
    return traceServerRouteData(
      {
        name: SERVER_ROUTE_SPAN_NAMES.wavesIndexDataPath,
        routeFamily: "/waves",
        dataPath: "none",
        apiRequestCount: 0,
      },
      () => (
        <>
          <JsonLdScript data={buildWavesIndexPageJsonLd()} />
          <Suspense fallback={null}>
            <WavesPageClient />
          </Suspense>
        </>
      )
    );
  }

  const headers = await getAppCommonHeaders();
  let context: WaveRequestContext;
  try {
    context = await traceServerRouteData(
      {
        name: SERVER_ROUTE_SPAN_NAMES.wavesMetadataFetch,
        routeFamily: "/waves/[wave]",
        dataPath: "wave_metadata",
        apiRequestCount: 1,
        authCohort: getServerRouteAuthCohort(headers),
      },
      async () => {
        const result = await fetchWaveContextResult(waveId, headers);
        if (!result.fetchResult.ok) {
          throw result.fetchResult.error;
        }
        return result.context;
      }
    );
  } catch {
    context = { waveId, wave: null, headers };
  }
  const queryClient = new QueryClient();

  if (context.waveId && context.wave) {
    const isDirectMessage = isApiWaveDirectMessage(context.wave);
    if (
      (routeContext === "waves" && isDirectMessage) ||
      (routeContext === "messages" && !isDirectMessage)
    ) {
      redirect(
        getWaveRouteWithSearchParams({
          waveId: context.waveId,
          searchParams,
          isDirectMessage,
        })
      );
    }

    queryClient.setQueryData(getWaveQueryKey(context.waveId), context.wave);
  }

  const initialFeedRouteFamily =
    routeContext === "messages" ? "/messages/[wave]" : "/waves/[wave]";
  const initialFeedPromise =
    context.waveId && context.wave
      ? fetchServerWaveFeedSeed({
          headers: context.headers,
          routeFamily: initialFeedRouteFamily,
          waveId: context.waveId,
        })
      : null;

  const dropMetadataId = getDropMetadataId(searchParams)?.trim();
  const dropMetadata =
    context.wave && dropMetadataId
      ? await fetchDropOgMetadataCached(
          dropMetadataId,
          JSON.stringify(context.headers)
        )
      : null;

  return (
    <>
      <JsonLdScript
        data={
          context.wave
            ? buildWavePageJsonLd({
                wave: context.wave,
                path: buildWaveStructuredDataPath({
                  waveId: context.waveId,
                  searchParams,
                }),
                dropMetadata,
              })
            : buildWavesIndexPageJsonLd()
        }
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        {initialFeedPromise && context.waveId && context.wave ? (
          <WaveServerFeedSeedGate waveId={context.waveId}>
            <Suspense fallback={null}>
              <WaveServerFeedSeed
                promise={initialFeedPromise}
                wave={context.wave}
                waveId={context.waveId}
              />
            </Suspense>
            <Suspense fallback={null}>
              <WavesPageClient />
            </Suspense>
          </WaveServerFeedSeedGate>
        ) : (
          <Suspense fallback={null}>
            <WavesPageClient />
          </Suspense>
        )}
      </HydrationBoundary>
    </>
  );
}

export async function buildWavesMetadata(
  waveId: string | null,
  searchParams: WavesSearchParams = {}
): Promise<Metadata> {
  if (waveId === null) {
    return getAppMetadata({
      title: "Waves | Brain",
      description: "Browse and explore waves",
    });
  }

  const shortUuid =
    waveId.length > 12 ? `${waveId.slice(0, 8)}...${waveId.slice(-4)}` : waveId;
  const metadataHeaders = await getAppCommonHeaders();
  const metadataHeadersKey = JSON.stringify(metadataHeaders);
  const waveResult = await fetchWaveCached(waveId, metadataHeadersKey);
  const wave = waveResult.ok ? waveResult.wave : null;

  if (wave === null) {
    return getAppMetadata({
      title: `Wave ${shortUuid} | Waves`,
      description: "Browse and explore waves",
    });
  }

  const waveName =
    typeof wave.name === "string" && wave.name.trim().length > 0
      ? wave.name.trim()
      : `Wave ${shortUuid}`;

  const authorHandle =
    wave.author.handle && wave.author.handle.trim().length > 0
      ? `@${wave.author.handle.replace(/^@/, "")}`
      : formatAddress(wave.author.primary_address);

  const dropMetadataId = getDropMetadataId(searchParams)?.trim();
  if (dropMetadataId) {
    const dropMetadata = await fetchDropOgMetadataCached(
      dropMetadataId,
      metadataHeadersKey
    );
    const dropPageMetadata = buildDropPageMetadata({
      dropId: dropMetadataId,
      metadata: dropMetadata,
      waveName,
    });

    if (dropPageMetadata) {
      return getAppMetadata(dropPageMetadata);
    }
  }

  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: `${waveName} by ${authorHandle}`,
      description: "Waves",
      ogImage: `/api/og-metadata/waves/${encodeURIComponent(waveId)}`,
      ogImageAlt: `${waveName} wave social card`,
    })
  );
}

const getDropAuthorDisplay = (
  author: ApiOgMetadataProfile | undefined
): string => {
  const handle = author?.handle?.trim();
  if (handle) {
    return `@${handle.replace(/^@/, "")}`;
  }

  const address = author?.primary_address?.trim();
  return address ? formatAddress(address) : "Unknown";
};

const getDropTitle = (
  value: string | null | undefined,
  fallback: string
): string => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
};

const buildDropPageMetadata = ({
  dropId,
  metadata,
  waveName,
}: {
  readonly dropId: string;
  readonly metadata: ApiOgMetadata | null;
  readonly waveName: string;
}) => {
  const drop = metadata?.drop;
  const author = getDropAuthorDisplay(metadata?.author);

  if (!drop) {
    return null;
  }

  const ogImage = `/api/og-metadata/drops/${encodeURIComponent(dropId)}`;

  if (drop.drop_type === ApiDropMainType.Submission) {
    const title = getDropTitle(drop.title, `Drop #${drop.serial_no}`);
    return getLargeSocialCardMetadata({
      title: `${title} by ${author}`,
      description: `${waveName} | Waves`,
      ogImage,
      ogImageAlt: `${title} drop social card`,
    });
  }

  if (drop.drop_type === ApiDropMainType.Chat) {
    return getLargeSocialCardMetadata({
      title: `${author} in ${waveName}`,
      description: "Waves",
      ogImage,
      ogImageAlt: `${author} drop in ${waveName} social card`,
    });
  }

  return null;
};
