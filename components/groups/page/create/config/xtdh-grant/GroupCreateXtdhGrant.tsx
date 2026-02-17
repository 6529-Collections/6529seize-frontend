"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "react-use";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import {
  formatAmount,
  formatDateTime,
} from "@/components/user/xtdh/utils/xtdhGrantFormatters";
import GroupCreateXtdhGrantModal from "./GroupCreateXtdhGrantModal";
import {
  getGrantStatusLabel,
  isSelectableNonGrantedStatus,
  toShortGrantId,
} from "./utils";

interface GroupCreateXtdhGrantProps {
  readonly beneficiaryGrantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"];
  readonly setBeneficiaryGrantId: (
    grantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"]
  ) => void;
}

export default function GroupCreateXtdhGrant({
  beneficiaryGrantId,
  setBeneficiaryGrantId,
}: GroupCreateXtdhGrantProps) {
  const normalizedGrantId = beneficiaryGrantId?.trim() ?? "";
  const hasSelectedGrant = normalizedGrantId.length > 0;

  const [lookupGrantId, setLookupGrantId] = useState<string | null>(
    hasSelectedGrant ? normalizedGrantId : null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useDebounce(
    () => {
      setLookupGrantId(hasSelectedGrant ? normalizedGrantId : null);
    },
    250,
    [hasSelectedGrant, normalizedGrantId]
  );

  const { grant, isFetching, isError, errorMessage } = useXtdhGrantQuery({
    grantId: lookupGrantId,
    enabled: !!lookupGrantId,
  });

  const grantStatusLabel = useMemo(() => {
    if (grant?.status === undefined) {
      return null;
    }
    return getGrantStatusLabel({
      status: grant.status,
      validFrom: grant.valid_from,
      validTo: grant.valid_to,
    });
  }, [grant]);

  const showNonGrantedWarning =
    grant?.status !== undefined && isSelectableNonGrantedStatus(grant.status);
  const showLookupError = Boolean(lookupGrantId && isError);

  const onInputChange = (nextValue: string) => {
    const normalized = nextValue.trim();
    setBeneficiaryGrantId(normalized.length ? normalized : null);
  };

  const onClearSelection = () => {
    setLookupGrantId(null);
    setBeneficiaryGrantId(null);
  };

  const targetCollectionName = grant?.target_collection_name?.trim() ?? "";
  const selectedTargetLabel =
    targetCollectionName.length > 0
      ? targetCollectionName
      : (grant?.target_contract ?? "Unknown target");

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-shadow sm:tw-p-5">
      <div>
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50 sm:tw-text-lg">
          xTDH Grant Beneficiary
        </p>
        <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
          Optionally require identities to be beneficiaries of a selected xTDH
          grant.
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
          onClick={() => setIsModalOpen(true)}
          className="tw-h-[42px] tw-self-end tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
        >
          Find grant
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
              {toShortGrantId(lookupGrantId ?? "")}
            </span>
          </p>
        </div>
      )}

      {!!grant && (
        <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-3">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            {grantStatusLabel && (
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-400/20 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-tracking-wide tw-text-primary-300">
                {grantStatusLabel}
              </span>
            )}
            <p className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
              {selectedTargetLabel}
            </p>
          </div>

          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
            ID: {toShortGrantId(grant.id)} | Rate: {formatAmount(grant.rate)}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-500">
            Valid:{" "}
            {formatDateTime(grant.valid_from ?? null, {
              fallbackLabel: "Immediately",
              includeTime: false,
            })}{" "}
            {"->"}{" "}
            {formatDateTime(grant.valid_to ?? null, {
              fallbackLabel: "No expiry",
              includeTime: false,
            })}
          </p>
        </div>
      )}

      {showNonGrantedWarning && (
        <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-300/30 tw-bg-amber-300/10 tw-p-3">
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-amber-300">
            Selected grant status is not GRANTED. This filter is still allowed
            and will be submitted.
          </p>
        </div>
      )}

      <GroupCreateXtdhGrantModal
        isOpen={isModalOpen}
        selectedGrantId={beneficiaryGrantId ?? null}
        onClose={() => setIsModalOpen(false)}
        onGrantSelect={(selectedGrant) => {
          setBeneficiaryGrantId(selectedGrant.id);
          setLookupGrantId(selectedGrant.id);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
