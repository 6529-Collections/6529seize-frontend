import type { ApiXtdhToken } from "../types";

export function getTokenKey(token: ApiXtdhToken): string {
  const contract = token.contract?.toLowerCase() ?? "unknown";
  const tokenId = Number.isFinite(token.token)
    ? Math.trunc(token.token).toString()
    : "unknown";
  return `${contract}-${tokenId}`;
}
