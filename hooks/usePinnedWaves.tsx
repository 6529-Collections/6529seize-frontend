"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { Time } from "@/helpers/time";

const MAX_PINNED_WAVES = 20;
const STORAGE_KEY = "pinnedWave";
const PINNED_WAVE_SNAPSHOT_TTL_MS = Time.days(1).toMillis();

type PinnedWaveContributor = {
  readonly pfp: string;
  readonly identity?: string | null;
};

export interface PinnedWaveSnapshot {
  readonly id: string;
  readonly name: string | null;
  readonly picture: string | null;
  readonly contributors: readonly PinnedWaveContributor[];
  readonly isDirectMessage: boolean;
  readonly fetchedAt: number;
}

interface UpsertPinnedWaveOptions {
  readonly moveToFront?: boolean | undefined;
}

const isPinnedWaveSnapshot = (
  value: unknown
): value is PinnedWaveSnapshot & { contributors?: unknown } => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string"
  );
};

const normalizePinnedWaveSnapshot = (
  value: unknown
): PinnedWaveSnapshot | null => {
  if (typeof value === "string") {
    return {
      id: value,
      name: null,
      picture: null,
      contributors: [],
      isDirectMessage: false,
      fetchedAt: 0,
    };
  }

  if (!isPinnedWaveSnapshot(value)) {
    return null;
  }

  const contributors = Array.isArray(value.contributors)
    ? value.contributors
        .filter(
          (
            contributor
          ): contributor is { pfp: string; identity?: string | null } =>
            typeof contributor === "object" &&
            contributor !== null &&
            typeof (contributor as { pfp?: unknown }).pfp === "string"
        )
        .map((contributor) => ({
          pfp: contributor.pfp,
          identity:
            typeof contributor.identity === "string"
              ? contributor.identity
              : null,
        }))
    : [];

  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : null,
    picture: typeof value.picture === "string" ? value.picture : null,
    contributors,
    isDirectMessage: Boolean(value.isDirectMessage),
    fetchedAt:
      typeof (value as { fetchedAt?: unknown }).fetchedAt === "number" &&
      Number.isFinite((value as { fetchedAt?: number }).fetchedAt)
        ? Math.max(0, (value as { fetchedAt: number }).fetchedAt)
        : 0,
  };
};

const createPinnedWaveSnapshot = (
  wave: ApiWave,
  fetchedAt: number = Time.now().toMillis()
): PinnedWaveSnapshot => ({
  id: wave.id,
  name: wave.name,
  picture: wave.picture,
  contributors: wave.contributors_overview
    .filter((contributor) => contributor.contributor_pfp.length > 0)
    .map((contributor) => ({
      pfp: contributor.contributor_pfp,
      identity: contributor.contributor_identity,
    })),
  isDirectMessage: Boolean(wave.chat.scope.group?.is_direct_message),
  fetchedAt,
});

export const isPinnedWaveSnapshotStale = (
  snapshot: PinnedWaveSnapshot,
  now: number = Time.now().toMillis()
): boolean =>
  snapshot.fetchedAt <= 0 ||
  now - snapshot.fetchedAt >= PINNED_WAVE_SNAPSHOT_TTL_MS;

const readPinnedWaves = (): PinnedWaveSnapshot[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizePinnedWaveSnapshot(item))
      .filter((item): item is PinnedWaveSnapshot => item !== null)
      .slice(0, MAX_PINNED_WAVES);
  } catch {
    return [];
  }
};

export function usePinnedWaves() {
  const [pinnedWaves, setPinnedWaves] = useState<PinnedWaveSnapshot[]>(() =>
    readPinnedWaves()
  );

  const upsertWaveSnapshot = useCallback(
    (
      snapshot: PinnedWaveSnapshot,
      { moveToFront = false }: UpsertPinnedWaveOptions = {}
    ) => {
      setPinnedWaves((prev) => {
        const existingIndex = prev.findIndex(
          (pinnedWave) => pinnedWave.id === snapshot.id
        );

        if (moveToFront) {
          if (existingIndex === 0 && prev[0] === snapshot) {
            return prev;
          }

          const nextWaves = [
            snapshot,
            ...prev.filter((pinnedWave) => pinnedWave.id !== snapshot.id),
          ];
          return nextWaves.slice(0, MAX_PINNED_WAVES);
        }

        if (existingIndex === -1) {
          return [...prev, snapshot].slice(0, MAX_PINNED_WAVES);
        }

        if (prev[existingIndex] === snapshot) {
          return prev;
        }

        const nextWaves = [...prev];
        nextWaves[existingIndex] = snapshot;
        return nextWaves;
      });
    },
    []
  );

  const upsertWave = useCallback(
    (wave: ApiWave, options?: UpsertPinnedWaveOptions) => {
      upsertWaveSnapshot(createPinnedWaveSnapshot(wave), options);
    },
    [upsertWaveSnapshot]
  );

  const removeId = useCallback((id: string) => {
    setPinnedWaves((prev) => prev.filter((pinnedWave) => pinnedWave.id !== id));
  }, []);

  const getAllIds = useCallback(
    () => pinnedWaves.map((pinnedWave) => pinnedWave.id),
    [pinnedWaves]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedWaves));
  }, [pinnedWaves]);

  return {
    pinnedIds: pinnedWaves.map((pinnedWave) => pinnedWave.id),
    pinnedWaves,
    upsertWave,
    upsertWaveSnapshot,
    removeId,
    getAllIds,
  };
}
