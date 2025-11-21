export function shortenAddress(address?: string | null): string {
  if (typeof address !== "string") {
    return "";
  }

  const normalized = address.trim();

  if (!normalized.length) {
    return "";
  }

  if (!normalized.startsWith("0x") || normalized.length <= 10) {
    return normalized;
  }

  return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
}
