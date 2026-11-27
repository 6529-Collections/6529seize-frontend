import levels from "@/constants/levels.json";

interface LevelThreshold {
  readonly level: number;
  readonly threshold: number;
}

// Levels 0 to 100 have the set thresholds in this table.
const TABLE = levels as readonly LevelThreshold[];
const TABLE_TOP = TABLE[TABLE.length - 1]!;

// The levels page lists thresholds up to this level. Levels go on above it.
export const LAST_LEVEL_LISTED = 200;

/**
 * Above the table there is no cap. Each level needs the threshold before it
 * plus a 25th of it, rounded down: 4% more. The API uses the same rule.
 */
function getNextThresholdAboveTable(threshold: number): number {
  // threshold - threshold % 25 is a multiple of 25, so this division is exact.
  return threshold + (threshold - (threshold % 25)) / 25;
}

/**
 * Levels above the table, from 101 up, while their thresholds are exact
 * integers. The last one is level 602.
 */
const LEVELS_ABOVE_TABLE: readonly LevelThreshold[] = (() => {
  const above: LevelThreshold[] = [];
  let level = TABLE_TOP.level;
  for (
    let threshold = getNextThresholdAboveTable(TABLE_TOP.threshold);
    threshold <= Number.MAX_SAFE_INTEGER;
    threshold = getNextThresholdAboveTable(threshold)
  ) {
    level += 1;
    above.push({ level, threshold });
  }
  return above;
})();

/**
 * The level after the given one and the TDH + Rep it needs. Null for a level
 * that is not a whole number of 0 or more, and from level 602 up, where the
 * next threshold is too large to be exact.
 */
export function getNextLevelThreshold(level: number): LevelThreshold | null {
  if (!Number.isInteger(level) || level < 0) {
    return null;
  }
  if (level < TABLE_TOP.level) {
    return TABLE.find((entry) => entry.level === level + 1) ?? null;
  }
  return LEVELS_ABOVE_TABLE[level - TABLE_TOP.level] ?? null;
}

/** The thresholds the levels page lists, from level 0 up. */
export const LISTED_LEVEL_THRESHOLDS: readonly LevelThreshold[] = [
  ...TABLE,
  ...LEVELS_ABOVE_TABLE.slice(0, LAST_LEVEL_LISTED - TABLE_TOP.level),
];
