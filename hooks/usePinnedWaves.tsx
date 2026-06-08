"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { Time } from "@/helpers/time";

const MAX_PINNED_WAVES = 100;
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
  readonly type: ApiWaveType | null;
  readonly fetchedAt: number;
}

interface UpsertPinnedWaveOptions {
  readonly moveToFront?: boolean | undefined;
}

const arePinnedWaveContributorsEqual = (
  left: readonly PinnedWaveContributor[],
  right: readonly PinnedWaveContributor[]
): boolean =>
  left.length === right.length &&
  left.every(
    (contributor, index) =>
      contributor.pfp === right[index]?.pfp &&
      (contributor.identity ?? null) === (right[index].identity ?? null)
  );

const arePinnedWaveSnapshotsEqual = (
  left: PinnedWaveSnapshot,
  right: PinnedWaveSnapshot
): boolean =>
  left.id === right.id &&
  left.name === right.name &&
  left.picture === right.picture &&
  left.isDirectMessage === right.isDirectMessage &&
  left.type === right.type &&
  left.fetchedAt === right.fetchedAt &&
  arePinnedWaveContributorsEqual(left.contributors, right.contributors);

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
      type: null,
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

  const normalizedType = Object.values(ApiWaveType).includes(
    (value as { type?: unknown }).type as ApiWaveType
  )
    ? (value as { type: ApiWaveType }).type
    : null;
  const sanitizedFetchedAt =
    typeof (value as { fetchedAt?: unknown }).fetchedAt === "number" &&
    Number.isFinite((value as { fetchedAt?: number }).fetchedAt)
      ? Math.max(0, (value as { fetchedAt: number }).fetchedAt)
      : 0;

  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : null,
    picture: typeof value.picture === "string" ? value.picture : null,
    contributors,
    isDirectMessage: Boolean(value.isDirectMessage),
    type: normalizedType,
    fetchedAt: normalizedType === null ? 0 : sanitizedFetchedAt,
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
  type: wave.wave.type,
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
        const existingWave =
          existingIndex === -1 ? null : (prev[existingIndex] ?? null);

        if (moveToFront) {
          if (
            existingIndex === 0 &&
            existingWave &&
            arePinnedWaveSnapshotsEqual(existingWave, snapshot)
          ) {
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

        if (
          existingWave &&
          arePinnedWaveSnapshotsEqual(existingWave, snapshot)
        ) {
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
