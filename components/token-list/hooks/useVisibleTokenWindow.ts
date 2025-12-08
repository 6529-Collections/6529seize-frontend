import { useMemo } from "react";
import { expandRangesWindow } from "@/components/nft-picker/NftPicker.utils";
import type { TokenRange } from "@/components/nft-picker/NftPicker.types";
import { toDecimalString } from "../utils";
import type { TokenWindowEntry } from "../types";

export function useVisibleTokenWindow(
  ranges: TokenRange[],
  firstTokenIndex: number,
  lastTokenIndex: number,
  tokens?: readonly { tokenId: bigint; xtdh: number }[]
): TokenWindowEntry[] {
  return useMemo(() => {
    if (lastTokenIndex < firstTokenIndex) {
      return [];
    }

    if (tokens) {
      return tokens.slice(firstTokenIndex, lastTokenIndex + 1).map((token) => ({
        tokenId: token.tokenId,
        decimalId: toDecimalString(token.tokenId),
        xtdh: token.xtdh,
      }));
    }

    const windowSize = lastTokenIndex - firstTokenIndex + 1;
    return expandRangesWindow(ranges, firstTokenIndex, windowSize).map((tokenId) => ({
      tokenId,
      decimalId: toDecimalString(tokenId),
      xtdh: 0, // Default to 0 for ranges
    }));
  }, [ranges, firstTokenIndex, lastTokenIndex, tokens]);
}
