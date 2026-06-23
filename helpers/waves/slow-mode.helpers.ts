export const SLOW_MODE_MIN_MS = 1000;

export type SlowModeUnit = "seconds" | "minutes" | "hours";

export const SLOW_MODE_UNITS = ["seconds", "minutes", "hours"] as const;

const SLOW_MODE_UNIT_MS: Record<SlowModeUnit, number> = {
  seconds: 1000,
  minutes: 60_000,
  hours: 3_600_000,
};

const isValidSlowModeCooldownMs = (
  cooldownMs: number | null | undefined
): cooldownMs is number =>
  typeof cooldownMs === "number" &&
  !Number.isNaN(cooldownMs) &&
  cooldownMs >= SLOW_MODE_MIN_MS;

const isValidNextDropAllowed = (
  nextDropAllowed: number | null | undefined
): nextDropAllowed is number =>
  typeof nextDropAllowed === "number" &&
  !Number.isNaN(nextDropAllowed) &&
  nextDropAllowed > 0;

export const getSlowModeMs = ({
  value,
  unit,
}: {
  readonly value: number;
  readonly unit: SlowModeUnit;
}): number => value * SLOW_MODE_UNIT_MS[unit];

export const getSlowModeInputParts = (
  cooldownMs: number | null | undefined
): { readonly value: number; readonly unit: SlowModeUnit } => {
  if (!isValidSlowModeCooldownMs(cooldownMs)) {
    return { value: 30, unit: "seconds" };
  }

  if (cooldownMs % SLOW_MODE_UNIT_MS.hours === 0) {
    return { value: cooldownMs / SLOW_MODE_UNIT_MS.hours, unit: "hours" };
  }

  if (cooldownMs % SLOW_MODE_UNIT_MS.minutes === 0) {
    return { value: cooldownMs / SLOW_MODE_UNIT_MS.minutes, unit: "minutes" };
  }

  return {
    value: Math.max(1, Math.round(cooldownMs / SLOW_MODE_UNIT_MS.seconds)),
    unit: "seconds",
  };
};

export const formatSlowModeInterval = (
  cooldownMs: number | null | undefined
): string => {
  if (!isValidSlowModeCooldownMs(cooldownMs)) {
    return "Off";
  }

  if (cooldownMs % SLOW_MODE_UNIT_MS.hours === 0) {
    return `${cooldownMs / SLOW_MODE_UNIT_MS.hours}h`;
  }

  if (cooldownMs % SLOW_MODE_UNIT_MS.minutes === 0) {
    return `${cooldownMs / SLOW_MODE_UNIT_MS.minutes}m`;
  }

  return `${Math.max(1, Math.round(cooldownMs / SLOW_MODE_UNIT_MS.seconds))}s`;
};

export const formatSlowModeCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const paddedSeconds = seconds.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
};

export const getSlowModeRemainingMs = ({
  nextDropAllowed,
  now,
}: {
  readonly nextDropAllowed: number | null | undefined;
  readonly now: number;
}): number => {
  if (!isValidNextDropAllowed(nextDropAllowed)) {
    return 0;
  }

  return Math.max(0, nextDropAllowed - now);
};

export const isSlowModeCoolingDown = ({
  cooldownMs,
  nextDropAllowed,
  now,
}: {
  readonly cooldownMs: number | null | undefined;
  readonly nextDropAllowed: number | null | undefined;
  readonly now: number;
}): boolean =>
  isValidSlowModeCooldownMs(cooldownMs) &&
  getSlowModeRemainingMs({ nextDropAllowed, now }) > 0;
