export const parsePositiveWholeNumberInput = (value: string): number | null => {
  const normalizedValue = value.trim();
  if (normalizedValue === "") {
    return null;
  }

  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
};
