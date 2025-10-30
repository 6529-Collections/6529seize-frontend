import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { prefetchWavesOverview } from "@/helpers/stream.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWave } from "@/generated/models/ApiWave";
import { getAppMetadata } from "@/components/providers/metadata";
import WavesPageClient from "./page.client";
import { Time } from "@/helpers/time";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import type { Metadata } from "next";
import { formatAddress } from "@/helpers/Helpers";
import { formatCount } from "@/helpers/format.helpers";

type WaveRequestContext = {
  readonly waveId: string | null;
  readonly wave: ApiWave | null;
  readonly headers: Record<string, string>;
  readonly feedItemsFetchedAt: number | null;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

async function fetchWaveContext(
  waveId: string | null,
  providedCookies?: CookieStore
): Promise<WaveRequestContext> {
  const cookieStore = providedCookies ?? (await cookies());
  const headers = await getAppCommonHeaders();
  const feedItemsFetchedRaw = cookieStore.get(String(QueryKey.FEED_ITEMS))?.value;
  const feedItemsFetchedAt = Number.parseInt(feedItemsFetchedRaw ?? "", 10);

  const wave =
    waveId === null
      ? null
      : await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
          headers,
        }).catch((error) => {
          console.warn("Failed to fetch wave", { waveId, error });
          return null;
        });

  return {
    waveId,
    wave,
    headers,
    feedItemsFetchedAt: Number.isFinite(feedItemsFetchedAt)
      ? feedItemsFetchedAt
      : null,
  };
}

export default async function WavesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ wave?: string; drop?: string }>;
}) {
  noStore();
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const context = await fetchWaveContext(resolvedParams.wave ?? null, cookieStore);
  const queryClient = new QueryClient();

  if (context.waveId && context.wave) {
    queryClient.setQueryData([QueryKey.WAVE, { wave_id: context.waveId }], context.wave);
  }

  if (
    context.feedItemsFetchedAt === null ||
    context.feedItemsFetchedAt < Time.now().toMillis() - 60000
  ) {
    try {
      await prefetchWavesOverview({
        queryClient,
        headers: context.headers,
        waveId: context.waveId,
      });
    } catch (error) {
      console.warn("Waves overview prefetch failed", {
        waveId: context.waveId,
        error,
      });
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WavesPageClient />
    </HydrationBoundary>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  readonly searchParams: Promise<{ wave?: string }>;
}): Promise<Metadata> {
  noStore();
  const resolvedParams = await searchParams;
  const waveId = resolvedParams.wave ?? null;

  if (waveId === null) {
    return getAppMetadata({
      title: "Waves",
      description: "Browse and explore waves",
    });
  }

  const shortUuid =
    waveId.length > 12 ? `${waveId.slice(0, 8)}...${waveId.slice(-4)}` : waveId;
  const { wave } = await fetchWaveContext(waveId);

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
    wave.author?.handle && wave.author.handle.trim().length > 0
      ? `@${wave.author.handle}`
      : formatAddress(wave.author?.primary_address ?? "");

  const subscribersCount = wave.metrics?.subscribers_count;
  const dropsCount = wave.metrics?.drops_count;
  const subscribers = formatCount(subscribersCount);
  const drops = formatCount(dropsCount);
  const descriptionParts = [
    authorHandle && `Created by ${authorHandle}`,
    subscribers &&
      `${subscribers} ${
        subscribersCount === 1 ? "subscriber" : "subscribers"
      }`,
    drops && `${drops} ${dropsCount === 1 ? "drop" : "drops"} shared`,
  ].filter((part): part is string => typeof part === "string");

  const metadata: Parameters<typeof getAppMetadata>[0] = {
    title: `${waveName} | Waves`,
    description:
      descriptionParts.length > 0
        ? `${waveName} — ${descriptionParts.join(" • ")}`
        : "Browse and explore waves",
  };

  return getAppMetadata(
    wave.picture
      ? {
          ...metadata,
          ogImage: wave.picture,
          twitterCard: "summary_large_image",
        }
      : metadata
  );
}
