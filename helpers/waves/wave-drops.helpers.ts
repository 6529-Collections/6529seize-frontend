import { ApiDrop } from "../../generated/models/ApiDrop";
import { ApiDropWithoutWave } from "../../generated/models/ApiDropWithoutWave";
import { ApiWaveDropsFeed } from "../../generated/models/ApiWaveDropsFeed";
import { ApiWaveMin } from "../../generated/models/ApiWaveMin";
import { getStableDropKey } from "./drop.helpers";

export interface ExtendedDrop extends ApiDrop {
  readonly stableKey: string;
  readonly stableHash: string;
}

export const createExtendedDrop = (
  drop: ApiDropWithoutWave,
  wave: ApiWaveMin,
  prevDrops: ExtendedDrop[]
): ExtendedDrop => {
  const { key, hash } = getStableDropKey({ ...drop, wave }, prevDrops);
  return {
    ...drop,
    wave,
    stableKey: key,
    stableHash: hash,
  };
};

export const processWaveDropsFeed = (
  page: ApiWaveDropsFeed,
  prevDrops: ExtendedDrop[]
): ExtendedDrop[] => {
  return page.drops.map((drop) =>
    createExtendedDrop(drop, page.wave, prevDrops)
  );
};

export const mapToExtendedDrops = (
  pages: ApiWaveDropsFeed[],
  prevDrops: ExtendedDrop[],
  reverse: boolean = false
): ExtendedDrop[] => {
  const mappedDrops = pages.flatMap((page) =>
    processWaveDropsFeed(page, prevDrops)
  );
  return reverse ? mappedDrops.reverse() : mappedDrops;
};

const incrementKeyCount = (
  keyCount: Map<string, number>,
  key: string
): number => {
  const count = (keyCount.get(key) ?? 0) + 1;
  keyCount.set(key, count);
  return count;
};

const generateFinalKey = (
  keyCount: Map<string, number>,
  initialKey: string
): string => {
  const count = incrementKeyCount(keyCount, initialKey);
  return count > 1 ? `${initialKey}-${count}` : initialKey;
};

const createUpdatedDrop = (
  drop: ExtendedDrop,
  finalKey: string,
  existingDrop: ExtendedDrop | undefined
): ExtendedDrop => {
  if (existingDrop) {
    return {
      ...drop,
      stableKey: finalKey,
      stableHash: existingDrop.stableHash,
    };
  }
  return { ...drop, stableKey: finalKey };
};

export const generateUniqueKeys = (
  drops: ExtendedDrop[],
  prevDrops: ExtendedDrop[]
): ExtendedDrop[] => {
  const keyCount = new Map<string, number>();

  return drops.map((drop) => {
    const existingDrop = prevDrops.find(
      (d) => d.stableHash === drop.stableHash
    );
    const finalKey = generateFinalKey(keyCount, drop.stableKey);
    return createUpdatedDrop(drop, finalKey, existingDrop);
  });
};
