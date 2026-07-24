export const isMissingOutcomeAmount = (
  value: number | null | undefined
): boolean =>
  value === null || value === undefined || value === 0 || Number.isNaN(value);
