import { commonApiFetch } from "@/services/api/common-api";
import type { WaveSearchAuthor } from "./wave-drops-v2.types";

const DEFAULT_AUTHOR_LIMIT = 10;
const MAX_AUTHOR_LIMIT = 20;

export async function fetchWaveSearchAuthors({
  waveId,
  handle,
  limit = DEFAULT_AUTHOR_LIMIT,
  signal,
}: {
  readonly waveId: string;
  readonly handle: string;
  readonly limit?: number | undefined;
  readonly signal?: AbortSignal | undefined;
}): Promise<WaveSearchAuthor[]> {
  const finiteLimit = Number.isFinite(limit)
    ? Math.trunc(limit)
    : DEFAULT_AUTHOR_LIMIT;
  const safeLimit = Math.min(MAX_AUTHOR_LIMIT, Math.max(1, finiteLimit));
  return commonApiFetch<WaveSearchAuthor[]>({
    endpoint: `v2/waves/${encodeURIComponent(waveId)}/search-authors`,
    params: { handle: handle.trim(), limit: safeLimit.toString() },
    signal,
  });
}
