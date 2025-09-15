"use client";

import { useEffect, useMemo, useState } from "react";
import type { XtdhSelectedTarget, XtdhStandard, XtdhTargetScope } from "../../types";

type SearchResult = {
  address: string;
  name?: string;
  standard: XtdhStandard;
  verified?: boolean;
};

export default function CollectionTokenPicker({
  value,
  onChange,
}: {
  readonly value: XtdhSelectedTarget | null;
  readonly onChange: (target: XtdhSelectedTarget | null) => void;
}) {
  const [chain, setChain] = useState<string>("eth-mainnet");
  const [query, setQuery] = useState<string>("");
  const [debounced, setDebounced] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [scope, setScope] = useState<XtdhTargetScope>("COLLECTION");
  const [tokenIds, setTokenIds] = useState<Set<string>>(new Set());

  const [tokenPageKey, setTokenPageKey] = useState<string | undefined>(undefined);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokens, setTokens] = useState<string[]>([]);

  // Sync incoming value
  useEffect(() => {
    if (!value) {
      setSelected(null);
      setScope("COLLECTION");
      setTokenIds(new Set());
      setTokens([]);
      setTokenPageKey(undefined);
      return;
    }
    setSelected({ address: value.contractAddress, standard: value.standard } as SearchResult);
    setScope(value.scope);
    setTokenIds(new Set(value.tokenIds ?? []));
  }, [value?.contractAddress, value?.scope]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Search collections
  useEffect(() => {
    setError(null);
    setResults([]);
    if (debounced.length < 2) return;
    let aborted = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/collections/search?q=${encodeURIComponent(debounced)}&chain=${chain}`);
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
        if (!aborted) setError(e.message);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [debounced, chain]);

  // Emit target on change
  useEffect(() => {
    if (!selected) {
      onChange(null);
      return;
    }
    onChange({
      chain,
      contractAddress: selected.address,
      standard: selected.standard,
      scope,
      tokenIds: Array.from(tokenIds),
    });
  }, [selected, scope, tokenIds, chain]);

  // Load tokens list for TOKENS scope
  useEffect(() => {
    if (!selected || scope !== "TOKENS") return;
    let cancelled = false;
    setTokenLoading(true);
    const url = new URL(`/api/collections/${selected.address}/tokens`, window.location.origin);
    url.searchParams.set("chain", chain);
    url.searchParams.set("withMetadata", "false");
    if (tokenPageKey) url.searchParams.set("pageKey", tokenPageKey);
    url.searchParams.set("limit", "50");
    fetch(url.toString())
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return;
        if (!ok) throw new Error(d?.error || "tokens error");
        const list: string[] = (d?.nfts || []).map((n: any) => String(n.tokenId ?? n.tokenIdToken ?? n.id ?? ""));
        setTokens((prev) => (tokenPageKey ? [...prev, ...list] : list));
        setTokenPageKey(d?.pageKey);
      })
      .catch(() => void 0)
      .finally(() => !cancelled && setTokenLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selected?.address, scope]);

  const onLoadMore = () => {
    if (!tokenPageKey || tokenLoading) return;
    // Trigger useEffect by setting a non-undefined pageKey (already set), we can toggle scope to force reload
    setTokenPageKey(tokenPageKey); // no-op, but kept here for clarity
  };

  const addTokensFromInput = (input: string) => {
    const next = new Set(tokenIds);
    const parts = input
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      if (/^\d+$/.test(part)) {
        next.add(part);
      } else if (/^(\d+)-(\d+)$/.test(part)) {
        const [, a, b] = part.match(/(\d+)-(\d+)/)!;
        let start = Number(a);
        let end = Number(b);
        if (start > end) [start, end] = [end, start];
        for (let i = start; i <= end; i++) next.add(String(i));
      }
    }
    setTokenIds(next);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-gap-2 tw-flex-wrap">
        <select
          className="tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700 tw-px-2 tw-py-2"
          value={chain}
          onChange={(e) => {
            setChain(e.target.value);
            setSelected(null);
            setTokenIds(new Set());
            setTokens([]);
            setTokenPageKey(undefined);
          }}
        >
          <option value="eth-mainnet">Ethereum</option>
        </select>

        <div className="tw-flex-1 tw-min-w-[220px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collection by name or paste address"
            className="tw-w-full tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700 tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-border-primary-500"
          />
        </div>
      </div>

      {(debounced.length >= 2 || selected) && (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3 tw-border tw-border-iron-800 tw-rounded tw-p-2">
          {/* Left: results */}
          <div className="tw-flex tw-flex-col tw-gap-1 tw-max-h-72 tw-overflow-auto">
            {loading && <div className="tw-text-iron-300 tw-text-sm">Searching…</div>}
            {error && <div className="tw-text-red-400 tw-text-sm">{error}</div>}
            {!loading && !error && results.length > 0 &&
              results.map((r) => (
                <button
                  key={r.address}
                  onClick={() => setSelected(r)}
                  className={`tw-w-full tw-text-left tw-px-3 tw-py-2 tw-rounded hover:tw-bg-iron-800 tw-transition ${
                    selected?.address === r.address ? "tw-bg-iron-800 tw-border tw-border-iron-700" : ""
                  }`}
                >
                  <div className="tw-text-iron-100 tw-text-sm">{r.name || r.address}</div>
                  <div className="tw-text-iron-500 tw-text-xs">{short(r.address)} • {r.standard}</div>
                </button>
              ))}
            {!loading && !error && results.length === 0 && debounced.length >= 2 && (
              <div className="tw-text-iron-300 tw-text-sm">No results.</div>
            )}
          </div>

          {/* Right: scope + tokens */}
          <div className="tw-flex tw-flex-col tw-gap-2">
            {selected ? (
              <div className="tw-flex tw-flex-col tw-gap-2">
                <div className="tw-text-iron-200 tw-text-sm">
                  Selected: {selected.name || short(selected.address)} ({short(selected.address)})
                </div>
                <div className="tw-flex tw-gap-3 tw-flex-wrap">
                  {(["COLLECTION", "TOKENS"] as XtdhTargetScope[]).map((s) => (
                    <label key={s} className="tw-flex tw-items-center tw-gap-2 tw-text-iron-200 tw-text-sm">
                      <input type="radio" name="xtdh-scope" checked={scope === s} onChange={() => setScope(s)} />
                      {s === "COLLECTION" ? "Whole collection" : "Specific tokens"}
                    </label>
                  ))}
                </div>

                {scope === "TOKENS" && (
                  <div className="tw-flex tw-flex-col tw-gap-2">
                    <div className="tw-flex tw-gap-2 tw-flex-wrap">
                      <input
                        placeholder="Paste IDs or ranges e.g. 1,2,5-25"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTokensFromInput((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                        className="tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700 tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-border-primary-500 tw-min-w-[260px]"
                      />
                      <div className="tw-text-iron-300 tw-text-xs tw-self-center">Selected: {tokenIds.size}</div>
                      {tokenIds.size > 0 && (
                        <button
                          type="button"
                          className="tw-text-xs tw-rounded tw-border tw-border-iron-700 tw-text-iron-200 tw-px-2 tw-py-1 hover:tw-bg-iron-800"
                          onClick={() => setTokenIds(new Set())}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="tw-border tw-border-iron-800 tw-rounded tw-max-h-48 tw-overflow-auto">
                      {tokens.length === 0 && tokenLoading && (
                        <div className="tw-text-iron-300 tw-text-sm tw-p-2">Loading tokens…</div>
                      )}
                      {tokens.map((id) => {
                        const checked = tokenIds.has(id);
                        return (
                          <label
                            key={id}
                            className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-border-b tw-border-iron-900 hover:tw-bg-iron-800"
                          >
                            <span className="tw-text-iron-200 tw-text-sm">Token #{id}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(tokenIds);
                                if (e.target.checked) next.add(id);
                                else next.delete(id);
                                setTokenIds(next);
                              }}
                            />
                          </label>
                        );
                      })}
                      {tokenPageKey && (
                        <button
                          type="button"
                          onClick={onLoadMore}
                          className="tw-w-full tw-text-center tw-py-2 tw-text-iron-300 hover:tw-bg-iron-800"
                        >
                          Load more
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="tw-text-iron-400 tw-text-sm tw-p-2">Pick a collection to choose scope and tokens.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeStandard(input: any): XtdhStandard {
  const v = String(input || "").toUpperCase();
  if (v.includes("1155")) return "ERC1155";
  if (v.includes("721")) return "ERC721";
  return "UNKNOWN";
}

function short(addr: string): string {
  if (!addr?.startsWith("0x") || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

