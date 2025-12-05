import { getNodeEnv } from "@/config/env";
import type { TokenRange } from "@/components/nft-picker/NftPicker.types";
import { toCanonicalRanges } from "@/components/nft-picker/NftPicker.utils";

export const DEFAULT_GRANT_TOKENS_ERROR_MESSAGE =
  "We couldn't load the granted tokens right now. Please try again.";

export function mapTokensToRanges(tokens: readonly { token: string }[]): TokenRange[] {
  if (!tokens.length) {
    return [];
  }

  const ids: bigint[] = [];
  const isDevelopment = getNodeEnv() === "development";

  for (const item of tokens) {
    try {
      ids.push(BigInt(item.token));
    } catch {
      // Ignore malformed token identifiers.
      if (isDevelopment) {
        console.warn(`Ignoring malformed token identifier: ${item.token}`);
      }
    }
  }

  if (!ids.length) {
    return [];
  }

  return toCanonicalRanges(ids);
}

export function getGrantTokensErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "Loading granted tokens took too long. Please try again.";
  }

  return DEFAULT_GRANT_TOKENS_ERROR_MESSAGE;
}
