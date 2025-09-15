"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  XtdhSelectedTarget,
  XtdhStandard,
  XtdhTargetScope,
} from "./types";

export default function TargetSelector({
  onChange,
}: {
  readonly onChange: (target: XtdhSelectedTarget | null) => void;
}) {
  const [chain, setChain] = useState<string>("eth-mainnet");
  const [query, setQuery] = useState<string>("");
  const [debounced, setDebounced] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedContract, setSelectedContract] = useState<{
    address: string;
    name?: string;
    symbol?: string;
    standard: XtdhStandard;
  } | null>(null);

  const [scope, setScope] = useState<XtdhTargetScope>("COLLECTION");
  const [tokenIds, setTokenIds] = useState<Set<string>>(new Set());

  // Debounce search text
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Trigger search
  useEffect(() => {
    async function run() {
      setError(null);
      setResults([]);
      if (debounced.length < 2) return;
      setSearching(true);
      try {
        const res = await fetch(`/api/collections/search?q=${encodeURIComponent(debounced)}&chain=${chain}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Search failed");
        const contracts = (data?.contracts || []).map((c: any) => ({
          address: c.address,
          name: c?.spamInfo?.name || c.name || c.openSeaMetadata?.collectionName || c.address,
          symbol: c.symbol || c.openSeaMetadata?.safelistRequestStatus || undefined,
          standard: normalizeStandard(c?.contractDeployer?.contractStandard || c.tokenType),
        }));
        setResults(contracts);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setSearching(false);
      }
    }
    run();
  }, [debounced, chain]);

  useEffect(() => {
    // Emit selected target upward
    if (!selectedContract) return onChange(null);
    onChange({
      chain,
      contractAddress: selectedContract.address,
      standard: selectedContract.standard,
      scope,
      tokenIds: Array.from(tokenIds),
    });
  }, [chain, selectedContract, scope, tokenIds]);

  const resetSelection = () => {
    setSelectedContract(null);
    setTokenIds(new Set());
    setScope("COLLECTION");
  };

  const addTokenIdsFromInput = (input: string) => {
    const next = new Set(tokenIds);
    const parts = input.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean);
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

  const tokenCount = tokenIds.size;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-gap-2 tw-flex-wrap">
        <select
          className="tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700 tw-px-2 tw-py-2"
          value={chain}
          onChange={(e) => {
            setChain(e.target.value);
            resetSelection();
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

      {!selectedContract && (
        <div className="tw-flex tw-flex-col tw-gap-2">
          {searching && <div className="tw-text-iron-300 tw-text-sm">Searching…</div>}
          {error && <div className="tw-text-red-400 tw-text-sm">{error}</div>}
          {!searching && !error && results.length > 0 && (
            <div className="tw-border tw-border-iron-800 tw-rounded">
              {results.map((r) => (
                <button
                  key={r.address}
                  onClick={() => setSelectedContract(r)}
                  className="tw-w-full tw-text-left tw-px-3 tw-py-2 hover:tw-bg-iron-800 tw-transition"
                >
                  <div className="tw-text-iron-100 tw-text-sm">{r.name || r.address}</div>
                  <div className="tw-text-iron-500 tw-text-xs">{r.address} • {r.standard}</div>
                </button>
              ))}
            </div>
          )}
          {!searching && !error && debounced.length >= 2 && results.length === 0 && (
            <div className="tw-text-iron-300 tw-text-sm">No collections found.</div>
          )}
          {!searching && !error && debounced.length === 0 && (
            <div className="tw-text-iron-400 tw-text-xs">Start typing to search collections.</div>
          )}
        </div>
      )}

      {selectedContract && (
        <div className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-justify-between tw-items-center tw-gap-2">
            <div>
              <div className="tw-text-iron-100 tw-text-sm tw-font-semibold">{selectedContract.name || selectedContract.address}</div>
              <div className="tw-text-iron-500 tw-text-xs">{selectedContract.address} • {selectedContract.standard}</div>
            </div>
            <button
              onClick={resetSelection}
              className="tw-text-iron-300 tw-text-xs hover:tw-text-iron-100 tw-transition"
            >
              Change
            </button>
          </div>

          <div className="tw-flex tw-gap-4 tw-flex-wrap">
            <label className="tw-flex tw-items-center tw-gap-2 tw-text-iron-200 tw-text-sm">
              <input
                type="radio"
                name="scope"
                checked={scope === "COLLECTION"}
                onChange={() => setScope("COLLECTION")}
              />
              Whole collection
            </label>

            <label className="tw-flex tw-items-center tw-gap-2 tw-text-iron-200 tw-text-sm">
              <input
                type="radio"
                name="scope"
                checked={scope === "TOKENS"}
                onChange={() => setScope("TOKENS")}
              />
              Specific token IDs
            </label>
          </div>

          {scope === "TOKENS" && (
            <div className="tw-flex tw-flex-col tw-gap-3">
              <div className="tw-flex tw-gap-2 tw-flex-wrap">
                <TokenQuickAdd onAdd={(s) => addTokenIdsFromInput(s)} />
                <div className="tw-text-iron-400 tw-text-xs tw-self-center">
                  You can paste comma‑separated IDs or ranges like 1-100.
                </div>
              </div>
              <TokenSelectionSummary count={tokenCount} onClear={() => setTokenIds(new Set())} />
            </div>
          )}
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

function TokenQuickAdd({ onAdd }: { onAdd: (input: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="tw-flex tw-gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="e.g. 1,2,3 or 5-25"
        className="tw-min-w-[220px] tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700 tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-border-primary-500"
      />
      <button
        type="button"
        onClick={() => {
          if (val.trim()) onAdd(val);
          setVal("");
        }}
        className="tw-bg-iron-800 tw-text-iron-200 tw-rounded tw-px-3 tw-py-2 tw-border tw-border-iron-700 hover:tw-bg-iron-700 tw-transition"
      >
        Add
      </button>
    </div>
  );
}

function TokenSelectionSummary({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div className="tw-flex tw-justify-between tw-items-center tw-gap-2">
      <div className="tw-text-iron-200 tw-text-sm">Selected tokens: {count}</div>
      <button
        type="button"
        onClick={onClear}
        className="tw-text-iron-300 tw-text-xs hover:tw-text-iron-100 tw-transition"
      >
        Clear
      </button>
    </div>
  );
}
