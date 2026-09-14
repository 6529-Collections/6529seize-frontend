/** Exact order focus belongs to one artwork; collection navigation keeps other context. */
export function nftNavigationQuery(source?: { toString(): string }): string {
  const params = new URLSearchParams(source?.toString());
  params.delete("order");
  return params.toString();
}
