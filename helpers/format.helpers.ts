export function formatCount(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export function formatOrdinal(value: number): string {
  const normalized = Math.trunc(value);
  const absoluteValue = Math.abs(normalized);
  const mod100 = absoluteValue % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${normalized}th`;
  }

  const mod10 = absoluteValue % 10;
  if (mod10 === 1) {
    return `${normalized}st`;
  }
  if (mod10 === 2) {
    return `${normalized}nd`;
  }
  if (mod10 === 3) {
    return `${normalized}rd`;
  }
  return `${normalized}th`;
}
