"use client";

import { useEnsResolution } from "@/hooks/useEnsResolution";
import { useState } from "react";
import { useEnsName } from "wagmi";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import type { DelegationCollection } from "./delegation-constants";
import {
  CONSOLIDATION_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "./delegation-constants";
import { getGasError } from "./delegation-shared";
import type { DelegationToastState } from "./DelegationToast";
import {
  DelegationAddressDisabledInput,
  DelegationExpiryCalendar,
  DelegationFormField,
  DelegationFormInput,
  DelegationFormLabel,
  DelegationFormRow,
  DelegationFormShell,
  DelegationRadio,
  DelegationSubmitGroups,
  DelegationTokenSelection,
} from "./DelegationFormParts";

interface Props {
  address: string;
  delegation: { wallet: string; use_case: number; display: string };
  ens: string | null | undefined;
  collection: DelegationCollection;
  showCancel: boolean;
  showAddMore: boolean;
  onHide(): void;
  onSetToast(toast: DelegationToastState): void;
}

export default function UpdateDelegationComponent(props: Readonly<Props>) {
  const isDelegation = ![
    CONSOLIDATION_USE_CASE.use_case,
    SUB_DELEGATION_USE_CASE.use_case,
  ].includes(props.delegation.use_case);

  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [showTokensInput, setShowTokensInput] = useState(false);

  const [delegationDate, setDelegationDate] = useState<Date | undefined>(
    undefined
  );
  const [delegationToken, setDelegationToken] = useState<number | undefined>(
    undefined
  );

  const {
    inputValue: delegationToInput,
    address: delegationToAddress,
    handleInputChange: handleDelegationInputChange,
  } = useEnsResolution({ chainId: 1 });

  const [gasError, setGasError] = useState<string>();

  const previousDelegationEns = useEnsName({
    address: props.delegation.wallet as `0x${string}`,
    chainId: 1,
  });

  const contractWriteDelegationConfigParams = {
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      props.collection.contract,
      props.delegation.wallet,
      delegationToAddress,
      isDelegation && showExpiryCalendar && delegationDate
        ? delegationDate.getTime() / 1000
        : NEVER_DATE,
      props.delegation.use_case,
      !(isDelegation && showTokensInput),
      isDelegation && showTokensInput ? delegationToken : 0,
    ],
    functionName:
      validate().length === 0 ? "updateDelegationAddress" : undefined,
    onSettled(data: unknown, error: Error | null) {
      if (data) {
        setGasError(undefined);
      }
      if (error) {
        setGasError(getGasError(error));
      }
    },
  };

  function validate() {
    const newErrors: string[] = [];
    if (!delegationToAddress || !isValidEthAddress(delegationToAddress)) {
      newErrors.push("Missing or invalid New Address");
    }
    if (showExpiryCalendar && !delegationDate) {
      newErrors.push("Missing or invalid Expiry");
    }
    if (showTokensInput && !delegationToken) {
      newErrors.push("Missing or invalid Token ID");
    }

    return newErrors;
  }

  let recordLabel = "Delegation";
  if (props.delegation.use_case === CONSOLIDATION_USE_CASE.use_case) {
    recordLabel = "Consolidation";
  } else if (props.delegation.use_case === SUB_DELEGATION_USE_CASE.use_case) {
    recordLabel = "Delegation Manager";
  }

  return (
    <DelegationFormShell
      title={`Update ${recordLabel}`}
      description="Replace the receiving wallet or update optional delegation details without moving any NFTs."
      closeTitle="Update"
      showClose={props.showCancel}
      onHide={props.onHide}
    >
      <form>
        <DelegationFormRow>
          <DelegationFormLabel
            title="Delegator"
            tooltip="Original Delegator"
            span={4}
          />
          <DelegationFormField span={8}>
            <DelegationAddressDisabledInput
              address={props.address}
              ens={props.ens}
              label="Delegator"
            />
          </DelegationFormField>
        </DelegationFormRow>
        <DelegationFormRow>
          <DelegationFormLabel
            title="Collection"
            tooltip="Collection address for delegation"
            span={4}
          />
          <DelegationFormField span={8}>
            <DelegationFormInput
              aria-label="Collection"
              type="text"
              value={`${props.collection.display}`}
              disabled
            />
          </DelegationFormField>
        </DelegationFormRow>
        {isDelegation && (
          <DelegationFormRow>
            <DelegationFormLabel
              title="Use Case"
              tooltip="Delegation Use Case"
              span={4}
            />
            <DelegationFormField span={8}>
              <DelegationFormInput
                aria-label="Use Case"
                type="text"
                value={`#${props.delegation.use_case} - ${props.delegation.display}`}
                disabled
              />
            </DelegationFormField>
          </DelegationFormRow>
        )}
        <DelegationFormRow>
          <DelegationFormLabel
            title="Current Delegate Address"
            tooltip="Current Delegate to Address"
            span={4}
          />
          <DelegationFormField span={8}>
            <DelegationFormInput
              aria-label="Current Delegate Address"
              type="text"
              value={
                previousDelegationEns.data
                  ? `${previousDelegationEns.data} - ${props.delegation.wallet}`
                  : props.delegation.wallet
              }
              disabled
            />
          </DelegationFormField>
        </DelegationFormRow>
        <DelegationFormRow>
          <DelegationFormLabel
            title="New Delegate Address"
            tooltip="New Delegate to Address"
            span={4}
          />
          <DelegationFormField span={8}>
            <DelegationFormInput
              aria-label="New Delegate Address"
              placeholder="Delegate to - 0x... or ENS"
              type="text"
              value={delegationToInput}
              onChange={(e) => {
                handleDelegationInputChange(e.target.value);
                setGasError(undefined);
              }}
            />
          </DelegationFormField>
        </DelegationFormRow>
        {isDelegation && (
          <DelegationFormRow>
            <DelegationFormLabel
              title="Expiry Date"
              tooltip="Expiry date for delegation (optional)"
              span={4}
            />
            <DelegationFormField span={8}>
              <DelegationRadio
                checked={!showExpiryCalendar}
                label="Never"
                name="expiryRadio"
                onChange={() => setShowExpiryCalendar(false)}
              />
              <DelegationRadio
                checked={showExpiryCalendar}
                label="Select Date"
                disabled={
                  props.delegation.use_case === 16 ||
                  props.delegation.use_case === 99
                }
                name="expiryRadio"
                onChange={() => setShowExpiryCalendar(true)}
              />
              {showExpiryCalendar && (
                <DelegationExpiryCalendar
                  setDelegationDate={setDelegationDate}
                />
              )}
            </DelegationFormField>
          </DelegationFormRow>
        )}
        {isDelegation && (
          <DelegationFormRow>
            <DelegationFormLabel
              title="Tokens"
              tooltip="Tokens involved in the delegation (optional)"
              span={4}
            />
            <DelegationFormField span={8}>
              <DelegationRadio
                checked={!showTokensInput}
                label="All"
                name="tokenIdRadio"
                onChange={() => setShowTokensInput(false)}
              />
              <DelegationRadio
                checked={showTokensInput}
                disabled={
                  props.delegation.use_case === 16 ||
                  props.delegation.use_case === 99
                }
                label="Select Token ID"
                name="tokenIdRadio"
                onChange={() => setShowTokensInput(true)}
              />
              {showTokensInput && (
                <DelegationTokenSelection
                  setDelegationToken={setDelegationToken}
                />
              )}
            </DelegationFormField>
          </DelegationFormRow>
        )}
        <DelegationSubmitGroups
          title={"Updating Delegation"}
          writeParams={contractWriteDelegationConfigParams}
          showCancel={props.showCancel}
          gasError={gasError}
          validate={validate}
          onHide={props.onHide}
          onSetToast={props.onSetToast}
        />
      </form>
    </DelegationFormShell>
  );
}
