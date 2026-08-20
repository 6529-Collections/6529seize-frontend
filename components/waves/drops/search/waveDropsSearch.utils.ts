export const MIN_WAVE_SEARCH_QUERY_LENGTH = 3;

export const parseLocalDateStart = (value: string): number | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date.getTime();
};

export const isValidWaveSearchDateRange = (
  after: string,
  before: string
): boolean => {
  const afterTimestamp = after ? parseLocalDateStart(after) : undefined;
  const beforeTimestamp = before ? parseLocalDateStart(before) : undefined;
  if (after && afterTimestamp === undefined) return false;
  if (before && beforeTimestamp === undefined) return false;
  return (
    afterTimestamp === undefined ||
    beforeTimestamp === undefined ||
    afterTimestamp < beforeTimestamp
  );
};
