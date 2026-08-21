function getProtocolPrefix(value: string): "http" | "https" | null {
  const lowerValue = value.toLowerCase();
  if (lowerValue.startsWith("https://")) return "https";
  if (lowerValue.startsWith("http://")) return "http";
  return null;
}

export function collapseProtocolPrefix(value: string): string {
  const scheme = getProtocolPrefix(value);
  if (scheme === null) return value;

  const remainder = value.slice(scheme.length + 3);
  return getProtocolPrefix(remainder) === null
    ? `${scheme}://${remainder}`
    : collapseProtocolPrefix(remainder);
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
