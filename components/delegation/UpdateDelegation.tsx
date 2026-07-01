"use client";

import { useEnsResolution } from "@/hooks/useEnsResolution";
import { useState } from "react";
import { useEnsName } from "wagmi";
import styles from "./Delegation.module.scss";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import type { DelegationCollection } from "./delegation-constants";
import {
  CONSOLIDATION_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "./delegation-constants";
import { getGasError } from "./delegation-shared";
import {
  DelegationAddressDisabledInput,
  DelegationCloseButton,
  DelegationExpiryCalendar,
  DelegationFormField,
  DelegationFormInput,
  DelegationFormLabel,
  DelegationFormRow,
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
  onHide(): any;
  onSetToast(toast: any): any;
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
    onSettled(data: any, error: any) {
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

  return (
    <div className="tw-w-full tw-p-0">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-10/12 tw-px-3 tw-pb-4 tw-pt-3">
          <h4>
            Update{" "}
            {props.delegation.use_case === CONSOLIDATION_USE_CASE.use_case
              ? "Consolidation"
              : props.delegation.use_case === SUB_DELEGATION_USE_CASE.use_case
                ? "Delegation Manager"
                : "Delegation"}
          </h4>
        </div>
        {props.showCancel && (
          <div className="tw-flex tw-w-2/12 tw-items-center tw-justify-end tw-px-3">
            <DelegationCloseButton onHide={props.onHide} title="Update" />
          </div>
        )}
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-px-3">
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
                  className={styles["formInputDisabled"]}
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
                    className={styles["formInputDisabled"]}
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
                  className={styles["formInputDisabled"]}
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
                  &nbsp;&nbsp;
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
                  &nbsp;&nbsp;
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
        </div>
      </div>
    </div>
  );
}
