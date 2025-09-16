import { useEffect, useMemo, useState } from "react";
import type { SearchResult } from "../allocate/utils";
import { normalizeStandard } from "../allocate/utils";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function useCollectionSearch({
  chain,
  query,
}: {
  chain: string;
  query: string;
}): { results: SearchResult[]; loading: boolean; error: string | null } {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResults([]);
    setError(null);
    if ((query || "").trim().length < 2) return;
    let aborted = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/collections/search?q=${encodeURIComponent(query)}&chain=${chain}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Search failed");
        if (aborted) return;
        const items: SearchResult[] = (data?.contracts || []).map((c: any) => ({
          address: c.address,
          name: c?.spamInfo?.name || c.name || c.openSeaMetadata?.collectionName || c.address,
          standard: normalizeStandard(c?.contractDeployer?.contractStandard || c.tokenType),
          verified: !!c?.openSeaMetadata?.safelistRequestStatus,
        }));
        setResults(items);
      } catch (e: any) {
        if (!aborted) setError(e?.message || "Search error");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [chain, query]);

  return { results, loading, error };
}

export function useTokenList({
  chain,
  address,
  enabled,
}: {
  chain: string;
  address: string | null;
  enabled: boolean;
}): {
  tokens: string[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
} {
  const [tokens, setTokens] = useState<string[]>([]);
  const [pageKey, setPageKey] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTokens([]);
    setPageKey(undefined);
  };

  const fetchPage = async (append: boolean) => {
    if (!enabled || !address) return;
    const url = new URL(`/api/collections/${address}/tokens`, window.location.origin);
    url.searchParams.set("chain", chain);
    url.searchParams.set("withMetadata", "false");
    if (append && pageKey) url.searchParams.set("pageKey", pageKey);
    url.searchParams.set("limit", "50");
    setLoading(true);
    try {
      const r = await fetch(url.toString());
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "tokens error");
      const list: string[] = (d?.nfts || []).map((n: any) => String(n.tokenId ?? n.tokenIdToken ?? n.id ?? ""));
      setTokens((prev) => (append ? [...prev, ...list] : list));
      setPageKey(d?.pageKey);
    } catch {
      // swallow
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reset();
    if (enabled && address) fetchPage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, address, enabled]);

  const hasMore = !!pageKey;
  const loadMore = () => fetchPage(true);

  return { tokens, loading, hasMore, loadMore, reset };
}

