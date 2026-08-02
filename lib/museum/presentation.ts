export function museumSlug(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

export function displayMuseumStatus(value: string): string {
  return value
    .replace(/[_-]+/gu, " ")
    .replace(/\b\w/gu, (letter) => letter.toLocaleUpperCase());
}

export function statusTone(
  value: string
): "neutral" | "success" | "warning" | "danger" {
  const normalized = value.toLocaleLowerCase();
  if (
    normalized.includes("complete") ||
    normalized.includes("accepted") ||
    normalized.includes("adopted")
  ) {
    return "success";
  }
  if (
    normalized.includes("progress") ||
    normalized.includes("selected") ||
    normalized.includes("pending") ||
    normalized.includes("conditional")
  ) {
    return "warning";
  }
  if (normalized.includes("rejected") || normalized.includes("invalid")) {
    return "danger";
  }
  return "neutral";
}
