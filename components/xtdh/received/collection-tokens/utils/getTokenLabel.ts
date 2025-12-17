export function getTokenLabel(tokenValue: number | null | undefined): string {
  if (Number.isFinite(tokenValue)) {
    return `#${Math.trunc(Number(tokenValue)).toString()}`;
  }

  return "Token";
}
