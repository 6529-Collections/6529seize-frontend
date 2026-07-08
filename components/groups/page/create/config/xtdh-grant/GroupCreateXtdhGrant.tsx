"use client";

import { useState } from "react";
import { useDebounce } from "react-use";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import GroupCreateXtdhGrantModal from "./GroupCreateXtdhGrantModal";
import GroupCreateXtdhGrantSelection from "./GroupCreateXtdhGrantSelection";
import { isSelectableNonGrantedStatus } from "./utils";
import {
  DEFAULT_BENEFICIARY_GRANT_MATCH_MODE,
  getGrantCompatibleMatchMode,
  useCompatibleXtdhGrantMatchMode,
} from "./GroupCreateXtdhGrantMatchMode";

interface GroupCreateXtdhGrantProps {
  readonly beneficiaryGrantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"];
  readonly beneficiaryGrantMatchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setBeneficiaryGrantId: (
    grantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"]
  ) => void;
  readonly setBeneficiaryGrantMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
}

export default function GroupCreateXtdhGrant({
  beneficiaryGrantId,
  beneficiaryGrantMatchMode,
  setBeneficiaryGrantId,
  setBeneficiaryGrantMatchMode,
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

  const isLookupFresh = lookupGrantId === normalizedGrantId;
  const showNonGrantedWarning =
    isLookupFresh &&
    grant?.status !== undefined &&
    isSelectableNonGrantedStatus(grant.status);
  const showLookupError = isLookupFresh && Boolean(lookupGrantId && isError);
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

  const onClearSelection = () => {
    setLookupGrantId(null);
    setBeneficiaryGrantId(null);
    setBeneficiaryGrantMatchMode(DEFAULT_BENEFICIARY_GRANT_MATCH_MODE);
  };

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-shadow sm:tw-p-5">
      <div>
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
          xTDH Grant Beneficiary
        </p>
        <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-500">
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
            className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-base tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-ring-primary-400 sm:tw-text-sm"
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

      <GroupCreateXtdhGrantModal
        isOpen={isModalOpen}
        selectedGrantId={beneficiaryGrantId ?? null}
        onClose={() => setIsModalOpen(false)}
        onGrantSelect={(selectedGrant) => {
          setBeneficiaryGrantId(selectedGrant.id);
          setLookupGrantId(selectedGrant.id);
          setBeneficiaryGrantMatchMode(
            getGrantCompatibleMatchMode(selectedGrant, effectiveMatchMode)
          );
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
