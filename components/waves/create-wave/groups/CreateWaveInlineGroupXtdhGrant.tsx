"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useDebounce } from "react-use";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import { useXtdhGrantsSearchQuery } from "@/hooks/useXtdhGrantsSearchQuery";
import GroupCreateXtdhGrantSelection from "@/components/groups/page/create/config/xtdh-grant/GroupCreateXtdhGrantSelection";
import GroupCreateXtdhGrantRow from "@/components/groups/page/create/config/xtdh-grant/subcomponents/GroupCreateXtdhGrantRow";
import {
  DEFAULT_BENEFICIARY_GRANT_MATCH_MODE,
  getGrantCompatibleMatchMode,
  useCompatibleXtdhGrantMatchMode,
} from "@/components/groups/page/create/config/xtdh-grant/GroupCreateXtdhGrantMatchMode";
import { isSelectableNonGrantedStatus } from "@/components/groups/page/create/config/xtdh-grant/utils";

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
  beneficiaryGrantMatchMode,
  setBeneficiaryGrantId,
  setBeneficiaryGrantMatchMode,
}: {
  readonly beneficiaryGrantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"];
  readonly beneficiaryGrantMatchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setBeneficiaryGrantId: (
    grantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"]
  ) => void;
  readonly setBeneficiaryGrantMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
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
  const effectiveMatchMode = useCompatibleXtdhGrantMatchMode({
    grant,
    hasSelectedGrant,
    isLookupFresh,
    matchMode: beneficiaryGrantMatchMode,
    setMatchMode: setBeneficiaryGrantMatchMode,
  });

  const onInputChange = (nextValue: string) => {
    const normalized = nextValue.trim();
    setBeneficiaryGrantId(normalized.length ? normalized : null);
    if (!normalized.length) {
      setBeneficiaryGrantMatchMode(DEFAULT_BENEFICIARY_GRANT_MATCH_MODE);
    }
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
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
          xTDH Grant Beneficiary
        </p>
        <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
          Require identities to be beneficiaries of a selected xTDH grant.
        </p>
      </div>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-[minmax(0,1fr)_auto]">
        <div className="tw-group tw-relative tw-w-full">
          <input
            id="create-wave-inline-xtdh-grant-id"
            type="text"
            value={normalizedGrantId}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder=" "
            className="tw-peer tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-base tw-font-medium tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-650 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm"
          />
          <label
            htmlFor="create-wave-inline-xtdh-grant-id"
            className="tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4"
          >
            Grant ID
          </label>
        </div>
        <button
          type="button"
          onClick={() => setShowGrantFinder((current) => !current)}
          aria-expanded={showGrantFinder}
          aria-controls="create-wave-inline-xtdh-grant-finder"
          className="tw-inline-flex tw-h-[42px] tw-items-center tw-justify-center tw-gap-2 tw-self-end tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
        >
          {showGrantFinder ? "Hide finder" : "Find grant"}
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-4 tw-flex-shrink-0 tw-transition-transform tw-duration-200 ${
              showGrantFinder ? "tw-rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <GroupCreateXtdhGrantSelection
        errorMessage={errorMessage}
        grant={grant}
        isFetching={isFetching}
        isLookupFresh={isLookupFresh}
        lookupGrantId={lookupGrantId}
        matchMode={effectiveMatchMode}
        setMatchMode={setBeneficiaryGrantMatchMode}
        showLookupError={showLookupError}
        showNonGrantedWarning={showNonGrantedWarning}
      />

      {showGrantFinder && (
        <div
          id="create-wave-inline-xtdh-grant-finder"
          className="tw-mt-6 tw-space-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-6"
        >
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
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-base tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-ring-primary-400 sm:tw-text-sm"
            />
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-3">
            <div className="tw-min-w-0 tw-flex-1">
              <span className="tw-mb-2 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                Filter by status
              </span>
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                {STATUS_OPTIONS.map((status) => {
                  const isActive = selectedStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={isActive}
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
            <div className="tw-flex tw-items-center tw-justify-between tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-2.5">
              <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                Results
              </p>
              <p className="tw-m-0 tw-text-xs tw-text-iron-500">
                {totalCount} total
              </p>
            </div>

            <div className="tw-max-h-80 tw-overflow-y-auto tw-p-2 sm:tw-p-3">
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
                        setBeneficiaryGrantMatchMode(
                          getGrantCompatibleMatchMode(
                            selectedGrant,
                            effectiveMatchMode
                          )
                        );
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
