import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiWave } from "@/generated/models/ApiWave";
import { applyDelayJitter } from "@/helpers/jitter.helpers";
import { WsMessageType } from "@/helpers/Types";
import { getWaveQueryKey } from "@/services/api/wave-query";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";

/** Wait before checking an incoming direct message's unread state. */
const DM_DROP_RECOVERY_GRACE_MS = 1_500;
// A drop whose wave may or may not be a direct message reaches every online
// tab at once. DM_UNREAD_STATE_CHANGED is the primary signal, so these
// recovery checks wait long and spread out (7.5-22.5 s).
const UNKNOWN_WAVE_RECOVERY_DELAY_MS = 15_000;
const UNKNOWN_WAVE_RECOVERY_JITTER_RATIO = 0.5;
// Bounds the waves whose kind one tab remembers; the least recently seen
// is forgotten first, and only costs a cache lookup when it returns.
const MAX_KNOWN_WAVES = 1_000;

interface IncomingDropUpdate {
  readonly author: { readonly id: string };
  readonly serial_no: number;
  readonly wave: { readonly id: string; readonly is_direct_message?: unknown };
}

interface IncomingDropUpdateRef {
  readonly author_id: string;
  readonly serial_no: number;
  readonly update_type: string;
  readonly wave_id: string;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isIncomingDropUpdate = (
  value: unknown
): value is IncomingDropUpdate => {
  if (!isRecord(value)) {
    return false;
  }
  const author = value["author"];
  const wave = value["wave"];
  return (
    typeof value["serial_no"] === "number" &&
    Number.isFinite(value["serial_no"]) &&
    isRecord(author) &&
    typeof author["id"] === "string" &&
    isRecord(wave) &&
    typeof wave["id"] === "string"
  );
};

export const isIncomingDropUpdateRef = (
  value: unknown
): value is IncomingDropUpdateRef =>
  isRecord(value) &&
  typeof value["author_id"] === "string" &&
  typeof value["serial_no"] === "number" &&
  Number.isFinite(value["serial_no"]) &&
  value["update_type"] === WsMessageType.DROP_UPDATE &&
  typeof value["wave_id"] === "string";

const DIRECT_MESSAGE = "direct-message";
type WaveKind = typeof DIRECT_MESSAGE | "other";
type CachedWaveKind = WaveKind | "unknown";

const toWaveKind = (isDirectMessage: boolean): WaveKind =>
  isDirectMessage ? DIRECT_MESSAGE : "other";

interface CachedWavesPage {
  readonly waves?: readonly {
    readonly id: string;
    readonly isDirectMessage?: boolean;
  }[];
}

function getCachedWaveKind(
  queryClient: QueryClient,
  waveId: string
): CachedWaveKind {
  const wave = queryClient.getQueryData<ApiWave>(getWaveQueryKey(waveId));
  if (wave) {
    return toWaveKind(wave.chat.scope.group?.is_direct_message === true);
  }
  const lists = queryClient.getQueriesData<InfiniteData<CachedWavesPage>>({
    queryKey: [QueryKey.WAVES_V2],
  });
  for (const [, data] of lists) {
    for (const page of data?.pages ?? []) {
      const listed = page.waves?.find((candidate) => candidate.id === waveId);
      if (typeof listed?.isDirectMessage === "boolean") {
        return toWaveKind(listed.isDirectMessage);
      }
    }
  }
  return "unknown";
}

/**
 * Decides when to check an incoming drop's DM unread state: soon for a
 * direct message, never for another wave, and late and jittered when the
 * client can't tell. Remembers each wave's kind once a frame or the caches
 * tell it (a wave's kind never changes), so compact references to it skip
 * the cache scan, which runs at most once per wave until it is known.
 */
export class DmDropRecoveryPolicy {
  // Insertion order is recency order: a bounded LRU.
  private readonly knownKinds = new Map<string, WaveKind>();

  getDelay({
    waveId,
    isDirectMessage,
    hasConversation,
    queryClient,
  }: {
    readonly waveId: string;
    readonly isDirectMessage: unknown;
    readonly hasConversation: boolean;
    readonly queryClient: QueryClient | undefined;
  }): number | null {
    let kind: CachedWaveKind =
      this.knownKinds.get(waveId) ??
      (hasConversation ? DIRECT_MESSAGE : "unknown");
    // A full frame's flag is authoritative.
    if (typeof isDirectMessage === "boolean") {
      kind = toWaveKind(isDirectMessage);
    }
    if (kind === "unknown" && queryClient) {
      kind = getCachedWaveKind(queryClient, waveId);
    }
    if (kind === "unknown") {
      return applyDelayJitter(
        UNKNOWN_WAVE_RECOVERY_DELAY_MS,
        UNKNOWN_WAVE_RECOVERY_JITTER_RATIO
      );
    }
    this.remember(waveId, kind);
    return kind === DIRECT_MESSAGE ? DM_DROP_RECOVERY_GRACE_MS : null;
  }

  private remember(waveId: string, kind: WaveKind): void {
    this.knownKinds.delete(waveId);
    if (this.knownKinds.size >= MAX_KNOWN_WAVES) {
      const leastRecent = this.knownKinds.keys().next().value;
      if (leastRecent !== undefined) this.knownKinds.delete(leastRecent);
    }
    this.knownKinds.set(waveId, kind);
  }
}
