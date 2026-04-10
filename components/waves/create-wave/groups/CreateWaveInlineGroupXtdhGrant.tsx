"use client";

import { useState } from "react";
import { useDebounce } from "react-use";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import { useXtdhGrantsSearchQuery } from "@/hooks/useXtdhGrantsSearchQuery";
import GroupCreateXtdhGrantRow from "@/components/groups/page/create/config/xtdh-grant/subcomponents/GroupCreateXtdhGrantRow";
import {
  isSelectableNonGrantedStatus,
  toShortGrantId,
} from "@/components/groups/page/create/config/xtdh-grant/utils";

const STATUS_OPTIONS = [
  ApiXTdhGrantStatus.Granted,
  ApiXTdhGrantStatus.Pending,
  ApiXTdhGrantStatus.Disabled,
  ApiXTdhGrantStatus.Failed,
] as const;

const STATUS_LABELS: Record<ApiXTdhGrantStatus, string> = {
  [ApiXTdhGrantStatus.Granted]: "Granted",
  [ApiXTdhGrantStatus.Pending]: "Pending",
  [ApiXTdhGrantStatus.Disabled]: "Revoked",
  [ApiXTdhGrantStatus.Failed]: "Failed",
};

export default function CreateWaveInlineGroupXtdhGrant({
  beneficiaryGrantId,
  setBeneficiaryGrantId,
}: {
  readonly beneficiaryGrantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"];
  readonly setBeneficiaryGrantId: (
    grantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"]
  ) => void;
}) {
  const normalizedGrantId = beneficiaryGrantId?.trim() ?? "";
  const hasSelectedGrant = normalizedGrantId.length > 0;

  const [showGrantFinder, setShowGrantFinder] = useState(false);
  const [lookupGrantId, setLookupGrantId] = useState<string | null>(
    hasSelectedGrant ? normalizedGrantId : null
  );
  const [selectedGrantor, setSelectedGrantor] = useState<string | null>(null);
  const [targetCollectionInput, setTargetCollectionInput] = useState("");
  const [targetCollectionFilter, setTargetCollectionFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApiXTdhGrantStatus>(
    ApiXTdhGrantStatus.Granted
  );

  useDebounce(
    () => setTargetCollectionFilter(targetCollectionInput.trim()),
    250,
    [targetCollectionInput]
  );

  useDebounce(
    () => setLookupGrantId(hasSelectedGrant ? normalizedGrantId : null),
    250,
    [hasSelectedGrant, normalizedGrantId]
  );

  const { grant, isFetching, isError, errorMessage } = useXtdhGrantQuery({
    grantId: lookupGrantId,
    enabled: !!lookupGrantId,
  });

  const {
    grants,
    totalCount,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError: isSearchError,
    errorMessage: searchErrorMessage,
    refetch,
  } = useXtdhGrantsSearchQuery({
    grantor: selectedGrantor,
    targetCollectionName: targetCollectionFilter || null,
    statuses: [selectedStatus],
    enabled: showGrantFinder,
    pageSize: 20,
  });

  const isLookupFresh = lookupGrantId === normalizedGrantId;
  const showLookupError = isLookupFresh && Boolean(lookupGrantId && isError);
  const showNonGrantedWarning =
    isLookupFresh &&
    grant?.status !== undefined &&
    isSelectableNonGrantedStatus(grant.status);

  const onInputChange = (nextValue: string) => {
    const normalized = nextValue.trim();
    setBeneficiaryGrantId(normalized.length ? normalized : null);
  };

  const onClearSelection = () => {
    setLookupGrantId(null);
    setBeneficiaryGrantId(null);
  };

  const onResetFilters = () => {
    setSelectedGrantor(null);
    setTargetCollectionInput("");
    setTargetCollectionFilter("");
    setSelectedStatus(ApiXTdhGrantStatus.Granted);
  };

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-shadow sm:tw-p-5">
      <div>
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50 sm:tw-text-lg">
          xTDH Grant Beneficiary
        </p>
        <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
          Require identities to be beneficiaries of a selected xTDH grant.
        </p>
      </div>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="tw-block">
          <span className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
            Grant ID
          </span>
          <input
            type="text"
            value={normalizedGrantId}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Paste grant id"
            className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-ring-primary-400"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowGrantFinder((current) => !current)}
          className="tw-h-[42px] tw-self-end tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
        >
          {showGrantFinder ? "Hide finder" : "Find grant"}
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={!normalizedGrantId.length}
          className="tw-h-[42px] tw-self-end tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-800"
        >
          Clear
        </button>
      </div>

      {isFetching && !!lookupGrantId && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-font-medium tw-text-iron-400">
          Validating grant...
        </p>
      )}

      {showLookupError && (
        <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-red/30 tw-bg-red/10 tw-p-3">
          <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-red">
            {errorMessage ?? "Unable to resolve grant ID."}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-red/90">
            The ID will still be submitted as entered:{" "}
            <span className="tw-font-semibold">
              {toShortGrantId(lookupGrantId)}
            </span>
          </p>
        </div>
      )}

      {isLookupFresh && !!grant && (
        <GroupCreateXtdhGrantRow
          grant={grant}
          isSelected={true}
          interactive={false}
          className="tw-mt-3"
        />
      )}

      {showNonGrantedWarning && (
        <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-300/30 tw-bg-amber-300/10 tw-p-3">
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-amber-300">
            Selected grant status is not GRANTED. This filter is still allowed
            and will be submitted.
          </p>
        </div>
      )}

      {showGrantFinder && (
        <div className="tw-mt-4 tw-space-y-4">
          <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
            <IdentitySearch
              label="Grantor"
              size={IdentitySearchSize.SM}
              identity={selectedGrantor}
              setIdentity={(identity) =>
                setSelectedGrantor(identity ? identity.toLowerCase() : null)
              }
            />
            <input
              type="text"
              value={targetCollectionInput}
              onChange={(event) => setTargetCollectionInput(event.target.value)}
              placeholder="Collection name"
              aria-label="Collection name"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-ring-primary-400"
            />
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-3">
            <div className="tw-min-w-0 tw-flex-1">
              <span className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                Status
              </span>
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                {STATUS_OPTIONS.map((status) => {
                  const isActive = selectedStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      className={`tw-rounded-md tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-transition tw-duration-200 ${
                        isActive
                          ? "tw-border-primary-400 tw-bg-primary-400/20 tw-text-primary-300"
                          : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 desktop-hover:hover:tw-border-iron-600"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={onResetFilters}
              className="tw-h-[42px] tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
            >
              Clear filters
            </button>
          </div>

          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/40">
            <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-2.5">
              <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                Results
              </p>
              <p className="tw-m-0 tw-text-xs tw-text-iron-500">
                {totalCount} total
              </p>
            </div>

            <div className="tw-max-h-[320px] tw-overflow-y-auto tw-p-2 sm:tw-p-3">
              {isLoading && !grants.length && (
                <p className="tw-m-0 tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-iron-400">
                  Loading grants...
                </p>
              )}

              {isSearchError && !grants.length && (
                <div className="tw-rounded-lg tw-border tw-border-solid tw-border-red/30 tw-bg-red/10 tw-p-4">
                  <p className="tw-m-0 tw-text-sm tw-text-red">
                    {searchErrorMessage ?? "Unable to load grants."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      refetch().catch(() => {
                        // Query error state is already rendered.
                      });
                    }}
                    className="tw-mt-3 tw-rounded-md tw-border tw-border-solid tw-border-red/40 tw-bg-red/20 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-red"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !isSearchError && !grants.length && (
                <p className="tw-m-0 tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-iron-400">
                  No grants matched the selected filters.
                </p>
              )}

              {!!grants.length && (
                <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
                  {grants.map((grantItem) => (
                    <GroupCreateXtdhGrantRow
                      key={grantItem.id}
                      grant={grantItem}
                      isSelected={normalizedGrantId === grantItem.id}
                      interactive={true}
                      asListItem={true}
                      onSelect={(selectedGrant) => {
                        setBeneficiaryGrantId(selectedGrant.id);
                        setLookupGrantId(selectedGrant.id);
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>

            {hasNextPage && (
              <div className="tw-border-t tw-border-solid tw-border-iron-800 tw-p-3">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800"
                >
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
