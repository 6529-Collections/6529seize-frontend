export const isMissingOutcomeAmount = (
  value: number | null | undefined
): boolean =>
  value === null ||
  value === undefined ||
  !Number.isFinite(value) ||
  value <= 0;
