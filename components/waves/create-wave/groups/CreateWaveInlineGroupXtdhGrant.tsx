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
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import GroupCreateXtdhGrantSelection from "@/components/groups/page/create/config/xtdh-grant/GroupCreateXtdhGrantSelection";
import GroupCreateXtdhGrantRow from "@/components/groups/page/create/config/xtdh-grant/subcomponents/GroupCreateXtdhGrantRow";
import Button from "@/components/utils/button/Button";
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

interface GrantFinderFilters {
  readonly selectedGrantor: string | null;
  readonly targetCollectionInput: string;
  readonly targetCollectionFilter: string;
  readonly selectedStatus: ApiXTdhGrantStatus;
}

const INITIAL_GRANT_FINDER_FILTERS: GrantFinderFilters = {
  selectedGrantor: null,
  targetCollectionInput: "",
  targetCollectionFilter: "",
  selectedStatus: ApiXTdhGrantStatus.Granted,
};

export default function CreateWaveInlineGroupXtdhGrant({
  beneficiaryGrantId,
  beneficiaryGrantMatchMode,
  setBeneficiaryGrant,
}: {
  readonly beneficiaryGrantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"];
  readonly beneficiaryGrantMatchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setBeneficiaryGrant: (
    grantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"],
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
}) {
  const normalizedGrantId = beneficiaryGrantId?.trim() ?? "";
  const hasSelectedGrant = normalizedGrantId.length > 0;
  const locale = useBrowserLocale();

  const [isChangingGrant, setIsChangingGrant] = useState(false);
  const [grantFinderFilters, setGrantFinderFilters] =
    useState<GrantFinderFilters>(INITIAL_GRANT_FINDER_FILTERS);
  const {
    selectedGrantor,
    selectedStatus,
    targetCollectionFilter,
    targetCollectionInput,
  } = grantFinderFilters;
  const showGrantFinder = !hasSelectedGrant || isChangingGrant;
  const lookupGrantId = hasSelectedGrant ? normalizedGrantId : null;

  useDebounce(
    () =>
      setGrantFinderFilters((current) => ({
        ...current,
        targetCollectionFilter: targetCollectionInput.trim(),
      })),
    250,
    [targetCollectionInput]
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
    setMatchMode: (matchMode) =>
      setBeneficiaryGrant(
        hasSelectedGrant ? normalizedGrantId : null,
        matchMode
      ),
  });

  const onRemoveGrant = () => {
    setIsChangingGrant(false);
    setBeneficiaryGrant(null, DEFAULT_BENEFICIARY_GRANT_MATCH_MODE);
  };

  const onResetFilters = () => {
    setGrantFinderFilters(INITIAL_GRANT_FINDER_FILTERS);
  };

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-shadow sm:tw-p-5">
      <div>
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
          xTDH Grant Beneficiary
        </p>
        <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
          Require identities to be beneficiaries of a selected xTDH grant.
        </p>
      </div>

      <GroupCreateXtdhGrantSelection
        errorMessage={errorMessage}
        grant={grant}
        isFetching={isFetching}
        isLookupFresh={isLookupFresh}
        lookupGrantId={lookupGrantId}
        matchMode={effectiveMatchMode}
        setMatchMode={(matchMode) =>
          setBeneficiaryGrant(
            hasSelectedGrant ? normalizedGrantId : null,
            matchMode
          )
        }
        showLookupError={showLookupError}
        showNonGrantedWarning={showNonGrantedWarning}
      />

      {hasSelectedGrant && (
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-justify-end tw-gap-2">
          <Button
            variant="tertiary"
            size="md"
            onClick={() => setIsChangingGrant((current) => !current)}
            aria-expanded={isChangingGrant}
            aria-controls="create-wave-inline-xtdh-grant-finder"
          >
            {isChangingGrant
              ? t(locale, "waves.create.groups.xtdhGrant.cancelChange")
              : t(locale, "waves.create.groups.xtdhGrant.change")}
          </Button>
          <Button variant="tertiary" size="md" onClick={onRemoveGrant}>
            {t(locale, "waves.create.groups.xtdhGrant.remove")}
          </Button>
        </div>
      )}

      {showGrantFinder && (
        <div
          id="create-wave-inline-xtdh-grant-finder"
          className="tw-mt-4 tw-space-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-4 sm:tw-mt-5 sm:tw-pt-5"
        >
          <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
            <IdentitySearch
              label="Grantor"
              size={IdentitySearchSize.SM}
              identity={selectedGrantor}
              setIdentity={(identity) =>
                setGrantFinderFilters((current) => ({
                  ...current,
                  selectedGrantor: identity ? identity.toLowerCase() : null,
                }))
              }
            />
            <input
              type="text"
              value={targetCollectionInput}
              onChange={(event) =>
                setGrantFinderFilters((current) => ({
                  ...current,
                  targetCollectionInput: event.target.value,
                }))
              }
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
                      onClick={() =>
                        setGrantFinderFilters((current) => ({
                          ...current,
                          selectedStatus: status,
                        }))
                      }
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
            <Button variant="tertiary" size="md" onClick={onResetFilters}>
              Clear filters
            </Button>
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
                  <Button
                    variant="tertiary"
                    size="xs"
                    onClick={() => {
                      refetch().catch(() => {
                        // Query error state is already rendered.
                      });
                    }}
                    className="tw-mt-3"
                  >
                    Retry
                  </Button>
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
                        setIsChangingGrant(false);
                        setBeneficiaryGrant(
                          selectedGrant.id,
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
                <Button
                  variant="tertiary"
                  size="md"
                  fullWidth
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
