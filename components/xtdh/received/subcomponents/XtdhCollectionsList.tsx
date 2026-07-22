import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  InlineRetry,
  ListError,
  ListMessage,
} from "../collection-tokens/subcomponents/XtdhTokensFallbacks";
import { XtdhReceivedCollectionCard } from "../collection-card-content";

type ApiXtdhCollection = Omit<
  ApiXTdhCollectionsPage["data"][number],
  "contract"
> & {
  readonly contract?: string | null | undefined;
};

interface XtdhCollectionsListProps {
  readonly isEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly collections: ApiXTdhCollectionsPage["data"];
  readonly errorMessage?: string | undefined;
  readonly onRetry: () => void;
  readonly selectedContract?: string | null | undefined;
  readonly onSelectCollection?: ((contract: string | null) => void) | undefined;
  readonly isIdentityScoped?: boolean | undefined;
  readonly searchTerm?: string | undefined;
}

export function XtdhCollectionsList({
  isEnabled,
  isLoading,
  isError,
  collections,
  errorMessage,
  onRetry,
  selectedContract,
  onSelectCollection,
  isIdentityScoped = true,
  searchTerm = "",
}: Readonly<XtdhCollectionsListProps>) {
  const locale = useBrowserLocale();
  const targetLabel = isIdentityScoped ? "this identity" : "the ecosystem";
  const normalizedSearchTerm = searchTerm.trim();
  if (!isEnabled) {
    return (
      <ListMessage>
        Unable to load xTDH collections for {targetLabel}.
      </ListMessage>
    );
  }

  const showInitialLoading = isLoading && collections.length === 0;
  if (showInitialLoading) {
    return <CollectionsSkeleton />;
  }

  const showInitialError = isError && collections.length === 0;
  if (showInitialError) {
    return (
      <ListError
        message={errorMessage ?? "Failed to load received collections."}
        onRetry={onRetry}
      />
    );
  }

  if (!collections.length) {
    if (normalizedSearchTerm) {
      return (
        <CollectionsEmptyState
          title={t(locale, "xtdh.collections.search.emptyTitle", {
            query: normalizedSearchTerm,
          })}
          message={t(locale, "xtdh.collections.search.emptyDescription")}
        />
      );
    }

    return (
      <CollectionsEmptyState
        title={isIdentityScoped ? "No xTDH received" : "No collections found"}
        message={
          isIdentityScoped
            ? "This identity will automatically accrue xTDH by holding eligible tokens from collections receiving grants."
            : "No xTDH collections to show yet. When grants are issued, collections receiving xTDH will appear here."
        }
      />
    );
  }

  const normalizedSelected = selectedContract?.trim().toLowerCase() ?? null;

  return (
    <div>
      <ul className="tw-m-0 tw-flex tw-flex-col tw-p-1">
        {collections.map((collection, index) => (
          <XtdhReceivedCollectionCard
            key={getCollectionKey(collection, index)}
            collection={collection}
            onSelect={onSelectCollection}
            isSelected={
              normalizedSelected !== null &&
              collection.contract.trim().toLowerCase() === normalizedSelected
            }
          />
        ))}
      </ul>
      {isError ? (
        <InlineRetry
          message={errorMessage ?? "Unable to load more collections."}
          onRetry={onRetry}
        />
      ) : null}
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="tw-p-1">
      <output className="tw-sr-only" aria-live="polite">
        Loading xTDH collections
      </output>
      <ul className="tw-m-0 tw-flex tw-flex-col tw-p-0" aria-busy="true">
        {SKELETON_ROWS.map((row) => (
          <li
            key={row}
            aria-hidden="true"
            className="tw-animate-pulse tw-list-none tw-rounded-xl tw-p-4 motion-reduce:tw-animate-none"
          >
            <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
                <div className="tw-size-14 tw-flex-shrink-0 tw-rounded-lg tw-bg-iron-800" />
                <div className="tw-flex-1 tw-space-y-2">
                  <div className="tw-h-4 tw-w-36 tw-max-w-full tw-rounded-full tw-bg-iron-800" />
                  <div className="tw-h-3 tw-w-24 tw-rounded-full tw-bg-iron-800" />
                </div>
              </div>
              <div className="tw-grid tw-w-full tw-grid-cols-2 tw-gap-6 sm:tw-w-[250px]">
                {SKELETON_SUMMARY_KEYS.map((summaryKey) => (
                  <div
                    key={summaryKey}
                    className="tw-space-y-2 sm:tw-text-right"
                  >
                    <div className="tw-h-3 tw-w-16 tw-rounded-full tw-bg-iron-800 sm:tw-ml-auto" />
                    <div className="tw-h-4 tw-w-20 tw-rounded-full tw-bg-iron-800 sm:tw-ml-auto" />
                  </div>
                ))}
              </div>
            </div>
            <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-pt-4 sm:tw-grid-cols-3 lg:tw-grid-cols-6">
              {SKELETON_METRIC_KEYS.map((metricKey) => (
                <div key={metricKey} className="tw-space-y-2">
                  <div className="tw-h-3 tw-w-20 tw-max-w-full tw-rounded-full tw-bg-iron-800" />
                  <div className="tw-h-4 tw-w-16 tw-rounded-full tw-bg-iron-800" />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SKELETON_ROWS = ["first", "second", "third"] as const;
const SKELETON_SUMMARY_KEYS = ["rate", "total"];
const SKELETON_METRIC_KEYS = Array.from(
  { length: 6 },
  (_, index) => `metric-${index}`
);

function CollectionsEmptyState({
  title,
  message,
}: Readonly<{ title: string; message: string }>) {
  return (
    <div
      role="status"
      className="tw-m-1 tw-flex tw-min-h-32 tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-iron-900/20 tw-p-6 tw-text-center"
    >
      <span className="tw-text-sm tw-font-medium tw-text-iron-400">
        {title}
      </span>
      <span className="tw-max-w-md tw-text-sm tw-leading-5 tw-text-iron-500">
        {message}
      </span>
    </div>
  );
}

function getCollectionKey(
  collection: ApiXtdhCollection,
  fallbackIndex: number
) {
  const normalizedContract = collection.contract?.trim().toLowerCase();
  if (normalizedContract) {
    return normalizedContract;
  }

  return [
    "fallback",
    fallbackIndex,
    collection.xtdh,
    collection.xtdh_rate,
    collection.total_token_count,
    collection.active_token_count,
    collection.total_contributor_count,
    collection.active_contributor_count,
  ].join("-");
}
