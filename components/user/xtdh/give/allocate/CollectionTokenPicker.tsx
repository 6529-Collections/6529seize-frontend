"use client";

import { useEffect, useState } from "react";
import type { XtdhSelectedTarget, XtdhTargetScope } from "../../types";
import type { SearchResult } from "./utils";
import { useCollectionSearch, useDebouncedValue, useTokenList } from "./hooks";
import ChainSelector from "./ChainSelector";
import CollectionSearchInput from "./CollectionSearchInput";
import CollectionSearchResults from "./CollectionSearchResults";
import SelectedCollectionHeader from "./SelectedCollectionHeader";
import ScopeSelector from "./ScopeSelector";
import TokenIdsEditor from "./TokenIdsEditor";
import TokenList from "./TokenList";

export default function CollectionTokenPicker({
  value,
  onChange,
}: {
  readonly value: XtdhSelectedTarget | null;
  readonly onChange: (target: XtdhSelectedTarget | null) => void;
}) {
  const [chain, setChain] = useState<string>("eth-mainnet");
  const [query, setQuery] = useState<string>("");
  const debounced = useDebouncedValue(query.trim(), 350);
  const { results, loading, error } = useCollectionSearch({ chain, query: debounced });

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [scope, setScope] = useState<XtdhTargetScope>("COLLECTION");
  const [tokenIds, setTokenIds] = useState<Set<string>>(new Set());

  const { tokens, loading: tokenLoading, hasMore, loadMore, reset: resetTokens } = useTokenList({
    chain,
    address: selected?.address ?? null,
    enabled: scope === "TOKENS" && !!selected?.address,
  });

  // Sync incoming value
  useEffect(() => {
    if (!value) {
      setSelected(null);
      setScope("COLLECTION");
      setTokenIds(new Set());
      resetTokens();
      return;
    }
    setSelected({ address: value.contractAddress, standard: value.standard } as SearchResult);
    setScope(value.scope);
    setTokenIds(new Set(value.tokenIds ?? []));
  }, [value?.contractAddress, value?.scope]);

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

  const onChainChange = (v: string) => {
    setChain(v);
    setSelected(null);
    setTokenIds(new Set());
    resetTokens();
  };


  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-gap-2 tw-flex-wrap">
        <ChainSelector value={chain} onChange={onChainChange} />
        <div className="tw-flex-1 tw-min-w-[220px]">
          <CollectionSearchInput value={query} onChange={setQuery} />
        </div>
      </div>

      {(debounced.length >= 2 || selected) && (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3 tw-border tw-border-iron-800 tw-rounded tw-p-2">
          {/* Left: results */}
          <CollectionSearchResults
            results={results}
            loading={loading}
            error={error}
            selectedAddress={selected?.address ?? null}
            onSelect={(r) => setSelected(r)}
          />

          {/* Right: scope + tokens */}
          <div className="tw-flex tw-flex-col tw-gap-2">
            {selected ? (
              <div className="tw-flex tw-flex-col tw-gap-2">
                <SelectedCollectionHeader name={selected.name} address={selected.address} />
                <ScopeSelector scope={scope} onChange={setScope} />

                {scope === "TOKENS" && (
                  <div className="tw-flex tw-flex-col tw-gap-2">
                    <TokenIdsEditor selectedIds={tokenIds} onChange={setTokenIds} />
                    <TokenList
                      tokens={tokens}
                      selectedIds={tokenIds}
                      onToggle={(id, checked) => {
                        const next = new Set(tokenIds);
                        if (checked) next.add(id);
                        else next.delete(id);
                        setTokenIds(next);
                      }}
                      loading={tokenLoading}
                      hasMore={hasMore}
                      onLoadMore={loadMore}
                    />
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