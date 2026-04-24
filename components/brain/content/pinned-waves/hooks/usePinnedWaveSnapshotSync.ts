import { useCallback, useEffect, useRef } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  isPinnedWaveSnapshotStale,
  type PinnedWaveSnapshot,
  usePinnedWaves,
} from "@/hooks/usePinnedWaves";
import { commonApiFetch } from "@/services/api/common-api";

const MAX_CONCURRENT_PINNED_WAVE_REFRESHES = 2;

interface UsePinnedWaveSnapshotSyncProps {
  readonly currentWaveId: string | null;
  readonly currentWave: ApiWave | undefined;
  readonly currentWaveIsDirectMessage: boolean;
}

type UsePinnedWavesResult = ReturnType<typeof usePinnedWaves>;
type UpsertPinnedWave = UsePinnedWavesResult["upsertWave"];
type RemovePinnedWaveId = UsePinnedWavesResult["removeId"];

interface MutableCurrentRef<T> {
  current: T;
}

interface RefreshPinnedWaveSnapshotArgs {
  readonly waveId: string;
  readonly isMountedRef: MutableCurrentRef<boolean>;
  readonly pinnedWavesRef: MutableCurrentRef<readonly PinnedWaveSnapshot[]>;
  readonly upsertWave: UpsertPinnedWave;
  readonly removeId: RemovePinnedWaveId;
}

interface UsePinnedWaveRefreshQueueProps {
  readonly currentWaveId: string | null;
  readonly pinnedWaves: readonly PinnedWaveSnapshot[];
  readonly upsertWave: UpsertPinnedWave;
  readonly removeId: RemovePinnedWaveId;
}

const getWaveContributors = (
  wave: ApiWave
): PinnedWaveSnapshot["contributors"] =>
  wave.contributors_overview
    .filter((contributor) => contributor.contributor_pfp.length > 0)
    .map((contributor) => ({
      pfp: contributor.contributor_pfp,
      identity: contributor.contributor_identity,
    }));

const hasSameContributors = (
  snapshotContributors: PinnedWaveSnapshot["contributors"],
  waveContributors: PinnedWaveSnapshot["contributors"]
): boolean =>
  snapshotContributors.length === waveContributors.length &&
  snapshotContributors.every(
    (contributor, index) =>
      contributor.pfp === waveContributors[index]?.pfp &&
      (contributor.identity ?? null) ===
        (waveContributors[index].identity ?? null)
  );

const hasSameWaveSnapshotContent = (
  snapshot: PinnedWaveSnapshot,
  wave: ApiWave
): boolean => {
  const waveContributors = getWaveContributors(wave);

  return (
    snapshot.id === wave.id &&
    snapshot.name === wave.name &&
    snapshot.picture === wave.picture &&
    snapshot.isDirectMessage ===
      Boolean(wave.chat.scope.group?.is_direct_message) &&
    snapshot.type === wave.wave.type &&
    hasSameContributors(snapshot.contributors, waveContributors)
  );
};

const parseStatusCode = (status: unknown): number | null => {
  if (typeof status === "number" && Number.isFinite(status)) {
    return status;
  }

  if (typeof status === "string") {
    const parsed = Number.parseInt(status, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const getErrorStatusCode = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const typedError = error as {
    readonly status?: unknown;
    readonly response?: { readonly status?: unknown } | undefined;
    readonly cause?:
      | {
          readonly status?: unknown;
          readonly response?: { readonly status?: unknown } | undefined;
        }
      | undefined;
  };

  return (
    parseStatusCode(typedError.status) ??
    parseStatusCode(typedError.response?.status) ??
    parseStatusCode(typedError.cause?.status) ??
    parseStatusCode(typedError.cause?.response?.status)
  );
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "";
};

const isPinnedWaveNotFoundError = (error: unknown, waveId: string): boolean =>
  getErrorStatusCode(error) === 404 ||
  getErrorMessage(error) === `Wave ${waveId} not found`;

const refreshPinnedWaveSnapshot = async ({
  waveId,
  isMountedRef,
  pinnedWavesRef,
  upsertWave,
  removeId,
}: RefreshPinnedWaveSnapshotArgs): Promise<void> => {
  try {
    const wave = await commonApiFetch<ApiWave>({
      endpoint: `waves/${waveId}`,
    });

    if (!isMountedRef.current) {
      return;
    }

    const isStillPinned = pinnedWavesRef.current.some(
      (snapshot) => snapshot.id === wave.id
    );
    if (!isStillPinned) {
      return;
    }

    upsertWave(wave, { moveToFront: false });
  } catch (error: unknown) {
    if (isPinnedWaveNotFoundError(error, waveId)) {
      if (isMountedRef.current) {
        removeId(waveId);
      }
      return;
    }

    console.warn("Failed to refresh pinned wave snapshot", {
      waveId,
      error,
    });
  }
};

const usePinnedWaveRefreshQueue = ({
  currentWaveId,
  pinnedWaves,
  upsertWave,
  removeId,
}: UsePinnedWaveRefreshQueueProps) => {
  const isMountedRef = useRef(true);
  const pinnedWavesRef = useRef<readonly PinnedWaveSnapshot[]>(pinnedWaves);
  const queuedRefreshIdsRef = useRef<Set<string>>(new Set());
  const refreshQueueRef = useRef<string[]>([]);
  const refreshingIdsRef = useRef<Set<string>>(new Set());
  const activeRefreshCountRef = useRef(0);
  const flushPinnedWaveRefreshQueueRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    pinnedWavesRef.current = pinnedWaves;
  }, [pinnedWaves]);

  useEffect(() => {
    const queuedRefreshIds = queuedRefreshIdsRef.current;
    const refreshingIds = refreshingIdsRef.current;

    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      queuedRefreshIds.clear();
      refreshQueueRef.current = [];
      refreshingIds.clear();
      activeRefreshCountRef.current = 0;
    };
  }, []);

  const flushPinnedWaveRefreshQueue = useCallback(() => {
    while (
      activeRefreshCountRef.current < MAX_CONCURRENT_PINNED_WAVE_REFRESHES &&
      refreshQueueRef.current.length > 0
    ) {
      const waveId = refreshQueueRef.current.shift();
      if (!waveId) {
        continue;
      }

      queuedRefreshIdsRef.current.delete(waveId);
      refreshingIdsRef.current.add(waveId);
      activeRefreshCountRef.current += 1;

      const refreshPinnedWave = async () => {
        try {
          await refreshPinnedWaveSnapshot({
            waveId,
            isMountedRef,
            pinnedWavesRef,
            upsertWave,
            removeId,
          });
        } finally {
          refreshingIdsRef.current.delete(waveId);
          activeRefreshCountRef.current = Math.max(
            0,
            activeRefreshCountRef.current - 1
          );

          if (isMountedRef.current) {
            flushPinnedWaveRefreshQueue();
          }
        }
      };

      void refreshPinnedWave();
    }
  }, [removeId, upsertWave]);

  useEffect(() => {
    flushPinnedWaveRefreshQueueRef.current = flushPinnedWaveRefreshQueue;
  }, [flushPinnedWaveRefreshQueue]);

  const schedulePinnedWaveRefresh = useCallback((waveId: string) => {
    if (
      queuedRefreshIdsRef.current.has(waveId) ||
      refreshingIdsRef.current.has(waveId)
    ) {
      return;
    }

    queuedRefreshIdsRef.current.add(waveId);
    refreshQueueRef.current.push(waveId);
    flushPinnedWaveRefreshQueueRef.current();
  }, []);

  const cancelRefresh = useCallback((waveId: string) => {
    queuedRefreshIdsRef.current.delete(waveId);
    refreshQueueRef.current = refreshQueueRef.current.filter(
      (queuedWaveId) => queuedWaveId !== waveId
    );
  }, []);

  useEffect(() => {
    for (const wave of pinnedWaves) {
      if (wave.id === currentWaveId) {
        continue;
      }

      if (!isPinnedWaveSnapshotStale(wave)) {
        continue;
      }

      schedulePinnedWaveRefresh(wave.id);
    }
  }, [currentWaveId, pinnedWaves, schedulePinnedWaveRefresh]);

  return { cancelRefresh };
};

export function usePinnedWaveSnapshotSync({
  currentWaveId,
  currentWave,
  currentWaveIsDirectMessage,
}: UsePinnedWaveSnapshotSyncProps) {
  const { pinnedWaves, upsertWave, upsertWaveSnapshot, removeId } =
    usePinnedWaves();
  const { cancelRefresh } = usePinnedWaveRefreshQueue({
    currentWaveId,
    pinnedWaves,
    upsertWave,
    removeId,
  });

  useEffect(() => {
    if (!currentWaveId) {
      return;
    }

    const existingWave =
      pinnedWaves.find((wave) => wave.id === currentWaveId) ?? null;

    if (currentWave) {
      if (
        pinnedWaves[0]?.id === currentWave.id &&
        existingWave &&
        hasSameWaveSnapshotContent(existingWave, currentWave)
      ) {
        return;
      }

      upsertWave(currentWave, { moveToFront: true });
      return;
    }

    if (existingWave) {
      upsertWaveSnapshot(existingWave, { moveToFront: true });
      return;
    }

    upsertWaveSnapshot(
      {
        id: currentWaveId,
        name: null,
        picture: null,
        contributors: [],
        isDirectMessage: currentWaveIsDirectMessage,
        type: null,
        fetchedAt: 0,
      },
      { moveToFront: true }
    );
  }, [
    currentWave,
    currentWaveId,
    currentWaveIsDirectMessage,
    pinnedWaves,
    upsertWave,
    upsertWaveSnapshot,
  ]);

  return { cancelRefresh, pinnedWaves, removeId };
}
