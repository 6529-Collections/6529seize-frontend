import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiWave } from "@/generated/models/ApiWave";
import { applyDelayJitter } from "@/helpers/jitter.helpers";
import { WsMessageType } from "@/helpers/Types";
import { getWaveQueryKey } from "@/services/api/wave-query";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";

/** Wait before checking an incoming direct message's unread state. */
export const DM_DROP_RECOVERY_GRACE_MS = 1_500;
// A drop whose wave may or may not be a direct message reaches every online
// tab at once. DM_UNREAD_STATE_CHANGED is the primary signal, so these
// recovery checks wait long and spread out (7.5-22.5 s).
const UNKNOWN_WAVE_RECOVERY_DELAY_MS = 15_000;
const UNKNOWN_WAVE_RECOVERY_JITTER_RATIO = 0.5;
// Bounds the waves remembered as not direct messages in one tab.
const MAX_KNOWN_OTHER_WAVES = 1_000;

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

type CachedWaveKind = "direct-message" | "other" | "unknown";

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
    return wave.chat.scope.group?.is_direct_message === true
      ? "direct-message"
      : "other";
  }
  const lists = queryClient.getQueriesData<InfiniteData<CachedWavesPage>>({
    queryKey: [QueryKey.WAVES_V2],
  });
  for (const [, data] of lists) {
    for (const page of data?.pages ?? []) {
      const listed = page.waves?.find((candidate) => candidate.id === waveId);
      if (typeof listed?.isDirectMessage === "boolean") {
        return listed.isDirectMessage ? "direct-message" : "other";
      }
    }
  }
  return "unknown";
}

/**
 * Decides when to check an incoming drop's DM unread state: soon for a
 * direct message, never for another wave, and late and jittered when the
 * client can't tell. Remembers waves that frames mark as not direct
 * messages, so their compact references are skipped too.
 */
export class DmDropRecoveryPolicy {
  private readonly otherWaveIds = new Set<string>();

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
    if (isDirectMessage === false) {
      this.rememberOther(waveId);
      return null;
    }
    if (isDirectMessage === true || hasConversation) {
      return DM_DROP_RECOVERY_GRACE_MS;
    }
    if (this.otherWaveIds.has(waveId)) {
      return null;
    }
    const kind = queryClient ? getCachedWaveKind(queryClient, waveId) : null;
    if (kind === "direct-message") {
      return DM_DROP_RECOVERY_GRACE_MS;
    }
    if (kind === "other") {
      return null;
    }
    return applyDelayJitter(
      UNKNOWN_WAVE_RECOVERY_DELAY_MS,
      UNKNOWN_WAVE_RECOVERY_JITTER_RATIO
    );
  }

  private rememberOther(waveId: string): void {
    if (this.otherWaveIds.size >= MAX_KNOWN_OTHER_WAVES) {
      this.otherWaveIds.clear();
    }
    this.otherWaveIds.add(waveId);
  }
}
