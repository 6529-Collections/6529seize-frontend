import "next/dist/compiled/server-only";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import type { HomeDropSelection } from "@/components/home/now-minting/homeDropSelection";
import { publicEnv } from "@/config/env";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
  NULL_MERKLE,
} from "@/constants/constants";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import type { ApiSeizeSettings } from "@/generated/models/ApiSeizeSettings";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecisionsPageV2 } from "@/generated/models/ApiWaveDecisionsPageV2";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import {
  getMemesManifoldPhaseId,
  isManifoldDropComplete,
} from "@/helpers/memes-manifold-phase.helpers";
import { getLatestDropTransitionTime } from "@/helpers/mint-visibility.helpers";
import { getRenderableWaveDecisionWinners } from "@/helpers/waves/wave-decision.helpers";
import { isPublicNonDirectMessageWave } from "@/helpers/waves/wave.helpers";
import { getEthereumMainnetClient } from "@/lib/ethereum/mainnetClient";
import {
  createFetchDeadline,
  discardResponse,
} from "@/lib/fetch/fetchDeadline";
import { publicSsrFetch } from "@/lib/fetch/ssrFetch";
import { apiUrl } from "@/services/api/api-endpoints";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { mapWaveDecisionsV2 } from "@/services/api/wave-decisions-v2-api";

const FIRST_PAINT_BUDGET_MS = 1200;
const PUBLIC_DATA_TTL_MS = 15_000;
const SETTINGS_TTL_MS = 60_000;

// Each read tracks only its most recent key, with a shared in-flight request.
// Keep the cached data separate from the clock-based selection.
function cacheHomeRead<K, T>(read: (key: K) => Promise<T>, ttl: number) {
  let cached: { key: K; result: Promise<T>; expiresAt: number } | undefined;

  return (key: K): Promise<T> => {
    if (
      cached?.key === key &&
      cached !== undefined &&
      cached.expiresAt > Date.now()
    ) {
      return cached.result;
    }

    const entry = { key, result: read(key), expiresAt: Infinity };
    cached = entry;
    void entry.result.then(
      () => {
        entry.expiresAt = Date.now() + ttl;
      },
      () => {
        if (cached === entry) cached = undefined;
      }
    );
    return entry.result;
  };
}

async function readPublicJson<T>(path: `/${string}`): Promise<T> {
  const response = await publicSsrFetch(apiUrl(path), { cache: "no-store" });
  if (!response.ok) {
    discardResponse(response);
    throw new Error(`Public home drop request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

const getLatestArtwork = cacheHomeRead(async () => {
  const nft = await readPublicJson<ApiMemesExtendedData | null>(
    "/api/memes_latest"
  );
  if (
    nft === null ||
    typeof nft.name !== "string" ||
    typeof nft.floor_price !== "number"
  ) {
    throw new Error("Latest Meme artwork is unavailable");
  }
  return nft;
}, PUBLIC_DATA_TTL_MS);

const getMainStageWaveId = cacheHomeRead(async () => {
  const settings =
    await readPublicJson<Pick<ApiSeizeSettings, "memes_wave_id">>(
      "/api/settings"
    );
  return publicEnv.DEV_MODE_MEMES_WAVE_ID ?? settings.memes_wave_id;
}, SETTINGS_TTL_MS);

const getWinnerForWave = cacheHomeRead(async (waveId: string) => {
  const encodedWaveId = encodeURIComponent(waveId);
  const [wave, decisions] = await Promise.all([
    readPublicJson<ApiWave>(`/api/waves/${encodedWaveId}`),
    readPublicJson<ApiWaveDecisionsPageV2>(
      `/api/v2/waves/${encodedWaveId}/decisions?sort=decision_time&sort_direction=DESC&page=1&page_size=1`
    ),
  ]);
  if (wave.id !== waveId || !isPublicNonDirectMessageWave(wave)) return null;

  const [latestDecision] = mapWaveDecisionsV2(decisions, waveId, wave).data;
  const winner = getRenderableWaveDecisionWinners(
    latestDecision?.winners ?? []
  )[0];
  const drop = (winner?.drop ?? null) as ApiDropV2View | null;
  return drop?.moderation?.can_view === false ? null : drop;
}, PUBLIC_DATA_TTL_MS);

async function getNextWinner() {
  const waveId = await getMainStageWaveId(undefined);
  return waveId ? getWinnerForWave(waveId) : null;
}

interface MainnetClaim {
  readonly total: number;
  readonly totalMax: number;
  readonly startDate: number;
  readonly endDate: number;
  readonly merkleRoot: string;
}

const getClaim = cacheHomeRead(async (tokenId: number) => {
  const result = await getEthereumMainnetClient().readContract({
    address: MANIFOLD_LAZY_CLAIM_CONTRACT,
    abi: MEMES_MANIFOLD_PROXY_ABI,
    functionName: "getClaimForToken",
    args: [MEMES_CONTRACT, BigInt(tokenId)],
  });
  const claim = Array.isArray(result)
    ? (result[1] as MainnetClaim | undefined)
    : undefined;
  if (
    !claim ||
    !Number.isSafeInteger(claim.total) ||
    !Number.isSafeInteger(claim.totalMax) ||
    !Number.isSafeInteger(claim.startDate) ||
    !Number.isSafeInteger(claim.endDate) ||
    typeof claim.merkleRoot !== "string"
  ) {
    throw new Error("Latest Meme claim is unavailable");
  }
  return claim;
}, PUBLIC_DATA_TTL_MS);

const getMintingRoots = cacheHomeRead(
  (tokenId: number) =>
    readPublicJson<MintingClaimsRootItem[]>(
      `/api/minting-claims/${encodeURIComponent(MEMES_CONTRACT)}/${tokenId}/roots`
    ),
  PUBLIC_DATA_TTL_MS
);

async function isMintComplete(tokenId: number): Promise<boolean> {
  const claim = await getClaim(tokenId);
  const remaining = claim.totalMax - claim.total;
  const ended = Date.now() >= Math.max(claim.startDate, claim.endDate) * 1000;
  const isPublic = claim.merkleRoot.toLowerCase() === NULL_MERKLE;
  if (remaining <= 0 || !ended || isPublic) {
    return isManifoldDropComplete(remaining, ended, false);
  }

  const roots = await getMintingRoots(tokenId).catch(() => null);
  const phaseId = getMemesManifoldPhaseId({
    isPublic,
    merkleRoot: claim.merkleRoot,
    start: claim.startDate,
    end: claim.endDate,
    roots,
  });
  return isManifoldDropComplete(
    remaining,
    ended,
    !!phaseId && phaseId !== "public"
  );
}

async function selectHomeDrop(): Promise<HomeDropSelection | null> {
  const nft = await getLatestArtwork(undefined);
  const transitionTime = getLatestDropTransitionTime(nft.id);
  if (transitionTime === null) return null;
  if (Date.now() < transitionTime) return { kind: "latest", nft };

  const [complete, winner] = await Promise.all([
    isMintComplete(nft.id),
    getNextWinner(),
  ]);
  return complete && winner
    ? { kind: "next", mintNumber: nft.id, drop: winner }
    : { kind: "latest", nft };
}

export async function getInitialHomeDrop(): Promise<HomeDropSelection | null> {
  const deadline = createFetchDeadline(
    undefined,
    FIRST_PAINT_BUDGET_MS,
    () => new Error("Home drop render budget elapsed")
  );
  try {
    return await deadline.run(selectHomeDrop);
  } catch {
    // In-flight reads can still warm the shared cache for the next visit.
    return null;
  } finally {
    deadline.dispose();
  }
}
