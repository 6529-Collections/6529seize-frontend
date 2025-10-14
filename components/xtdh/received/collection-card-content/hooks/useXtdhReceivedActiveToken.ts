'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

import type { XtdhReceivedNft } from "@/types/xtdh";

export interface UseXtdhReceivedActiveTokenResult {
  readonly activeTokenId: string | null;
  readonly activeToken: XtdhReceivedNft | null;
  readonly selectToken: (tokenId: string) => void;
  readonly clearSelection: () => void;
}

export function useXtdhReceivedActiveToken(
  tokens: readonly XtdhReceivedNft[],
): UseXtdhReceivedActiveTokenResult {
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens.length) {
      setActiveTokenId(null);
      return;
    }

    setActiveTokenId((previous) => {
      if (previous && tokens.some((token) => token.tokenId === previous)) {
        return previous;
      }

      return tokens[0]?.tokenId ?? null;
    });
  }, [tokens]);

  const activeToken = useMemo(
    () => tokens.find((token) => token.tokenId === activeTokenId) ?? null,
    [activeTokenId, tokens],
  );

  const selectToken = useCallback((tokenId: string) => {
    setActiveTokenId(tokenId);
  }, []);

  const clearSelection = useCallback(() => {
    setActiveTokenId(null);
  }, []);

  return {
    activeTokenId,
    activeToken,
    selectToken,
    clearSelection,
  };
}
