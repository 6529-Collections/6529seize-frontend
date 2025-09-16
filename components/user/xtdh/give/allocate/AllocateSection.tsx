"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import XTDHCard from "../../ui/XTDHCard";
import AllocateForm from "./AllocateForm";
import ChainSelector from "./ChainSelector";
import CollectionSearchInput from "./CollectionSearchInput";
import CollectionSearchResults from "./CollectionSearchResults";
import ScopeSelector from "./ScopeSelector";
import TokenIdsEditor from "./TokenIdsEditor";
import TokenList from "./TokenList";
import { useCollectionSearch, useDebouncedValue, useTokenList } from "./hooks";
import { short } from "./utils";
import type { XtdhSelectedTarget, XtdhTargetScope } from "../../types";
import type { SearchResult } from "./utils";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

type StepStatus = "pending" | "active" | "complete";

function StepSection({
  step,
  title,
  description,
  status,
  children,
}: {
  readonly step: number;
  readonly title: string;
  readonly description?: string;
  readonly status: StepStatus;
  readonly children: ReactNode;
}) {
  const isDisabled = status === "pending";
  const isComplete = status === "complete";

  return (
    <section
      className={`tw-rounded tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-space-y-3 ${
        isDisabled ? "tw-opacity-60" : ""
      }`}
      aria-disabled={isDisabled}
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div>
          <div className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400">Step {step}</div>
          <h3 className="tw-text-iron-100 tw-text-lg tw-font-semibold">{title}</h3>
          {description ? <p className="tw-text-iron-400 tw-text-sm tw-mt-1">{description}</p> : null}
        </div>
        {isComplete ? (
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-700 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-white">
            Done
          </span>
        ) : null}
      </div>
      <div className="tw-space-y-3">{children}</div>
    </section>
  );
}

const CHAIN_LABELS: Record<string, string> = {
  "eth-mainnet": "Ethereum",
};

export default function AllocateSection({
  profile,
  onAllocate,
}: {
  readonly profile: ApiIdentity;
  readonly onAllocate: (payload: {
    target: XtdhSelectedTarget;
    amountPerDay: number;
  }) => void;
}) {
  const [chain, setChain] = useState<string>("eth-mainnet");
  const [query, setQuery] = useState<string>("");
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, 300);
  const { results, loading, error } = useCollectionSearch({ chain, query: debouncedQuery });

  const [selectedCollection, setSelectedCollection] = useState<SearchResult | null>(null);
  const [scope, setScope] = useState<XtdhTargetScope>("COLLECTION");
  const [tokenIds, setTokenIds] = useState<Set<string>>(new Set());

  const {
    tokens,
    loading: tokenLoading,
    hasMore,
    loadMore,
    reset: resetTokens,
  } = useTokenList({
    chain,
    address: selectedCollection?.address ?? null,
    enabled: scope === "TOKENS" && !!selectedCollection?.address,
  });

  const resetTarget = () => {
    setSelectedCollection(null);
    setScope("COLLECTION");
    setTokenIds(new Set());
    resetTokens();
  };

  const resetAll = () => {
    setQuery("");
    resetTarget();
  };

  const handleChainChange = (nextChain: string) => {
    setChain(nextChain);
    resetAll();
  };

  const needsTokenSelection = scope === "TOKENS";
  const tokensSelectedCount = tokenIds.size;
  const collectionSelected = selectedCollection != null;
  const scopeConfigured = collectionSelected && (!needsTokenSelection || tokensSelectedCount > 0);

  const selectedTarget: XtdhSelectedTarget | null = useMemo(() => {
    if (!selectedCollection) return null;
    return {
      chain,
      contractAddress: selectedCollection.address,
      standard: selectedCollection.standard,
      scope,
      tokenIds: needsTokenSelection ? Array.from(tokenIds) : [],
    };
  }, [chain, scope, needsTokenSelection, selectedCollection, tokenIds]);

  const allocationReady = scopeConfigured && !!selectedTarget;

  const step1Status: StepStatus = collectionSelected ? "complete" : "active";
  const step2Status: StepStatus = collectionSelected ? (scopeConfigured ? "complete" : "active") : "pending";
  const step3Status: StepStatus = allocationReady ? "active" : "pending";

  const formKey = selectedTarget?.contractAddress ?? "no-target";

  const chainLabel = CHAIN_LABELS[chain] ?? chain;

  return (
    <XTDHCard title="Allocate xTDH">
      <div className="tw-flex tw-flex-col tw-gap-4">
        <StepSection
          step={1}
          title="Choose a collection"
          description="Search by name or paste a contract address."
          status={step1Status}
        >
          {selectedCollection ? (
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
              <div className="tw-text-sm tw-text-iron-200">
                {selectedCollection.name || short(selectedCollection.address)} ({short(selectedCollection.address)})
              </div>
              <button
                type="button"
                className="tw-text-xs tw-font-medium tw-text-primary-400 hover:tw-text-primary-300"
                onClick={resetTarget}
              >
                Change selection
              </button>
            </div>
          ) : (
            <>
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                <ChainSelector value={chain} onChange={handleChainChange} />
                <div className="tw-flex-1 tw-min-w-[220px]">
                  <CollectionSearchInput value={query} onChange={setQuery} />
                </div>
              </div>
              <div className="tw-rounded tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
                {debouncedQuery.length < 2 ? (
                  <div className="tw-text-sm tw-text-iron-400">
                    Enter at least two characters or paste a contract address to search.
                  </div>
                ) : (
                  <CollectionSearchResults
                    results={results}
                    loading={loading}
                    error={error}
                    selectedAddress={selectedCollection?.address ?? null}
                    onSelect={(result) => {
                      setSelectedCollection(result);
                      setScope("COLLECTION");
                      setTokenIds(new Set());
                      resetTokens();
                    }}
                  />
                )}
              </div>
            </>
          )}
        </StepSection>

        <StepSection
          step={2}
          title="Set the allocation scope"
          description="Keep the grant at the collection level or target specific token IDs."
          status={step2Status}
        >
          {!selectedCollection ? (
            <p className="tw-text-sm tw-text-iron-400">Select a collection before setting the scope.</p>
          ) : (
            <div className="tw-space-y-3">
              <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                <div>
                  <div className="tw-text-sm tw-font-medium tw-text-iron-100">
                    {selectedCollection.name || short(selectedCollection.address)}
                  </div>
                  <div className="tw-text-xs tw-text-iron-500">
                    {short(selectedCollection.address)} · {chainLabel}
                  </div>
                </div>
                <button
                  type="button"
                  className="tw-text-xs tw-font-medium tw-text-primary-400 hover:tw-text-primary-300"
                  onClick={resetTarget}
                >
                  Change
                </button>
              </div>

              <ScopeSelector
                scope={scope}
                onChange={(nextScope) => {
                  setScope(nextScope);
                  if (nextScope !== "TOKENS") {
                    setTokenIds(new Set());
                    resetTokens();
                  }
                }}
              />
              <p className="tw-text-xs tw-text-iron-400">
                "Specific tokens" lets you target individual IDs. Leave it on "Whole collection" to apply the grant to
                every token.
              </p>

              {scope === "TOKENS" ? (
                <div className="tw-space-y-3">
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
                  {needsTokenSelection && tokensSelectedCount === 0 ? (
                    <p className="tw-text-xs tw-text-red-400">Select at least one token ID for this grant.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </StepSection>

        <StepSection
          step={3}
          title="Choose the allocation amount"
          description="Decide how much xTDH to grant per day."
          status={step3Status}
        >
          {allocationReady && selectedTarget ? (
            <AllocateForm
              key={formKey}
              profile={profile}
              onSubmitAmount={(amountPerDay) => {
                if (!selectedTarget) return;
                onAllocate({ target: selectedTarget, amountPerDay });
                resetAll();
              }}
              disabled={!allocationReady}
              onCancel={resetAll}
              helpers={undefined}
            />
          ) : (
            <p className="tw-text-sm tw-text-iron-400">Complete the steps above to enable allocation controls.</p>
          )}
        </StepSection>
      </div>
    </XTDHCard>
  );
}
