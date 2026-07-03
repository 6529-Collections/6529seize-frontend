"use client";

import { useState } from "react";
import { useEnsName } from "wagmi";
import styles from "./Delegation.module.css";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import type { DelegationCollection } from "./delegation-constants";
import { ALL_USE_CASES } from "./delegation-constants";
import { getGasError } from "./delegation-shared";
import {
  DelegationAddressDisabledInput,
  DelegationCloseButton,
  DelegationFormField,
  DelegationFormCollectionFormGroup,
  DelegationFormDelegateAddressFormGroup,
  DelegationFormInput,
  DelegationFormLabel,
  DelegationFormRow,
  DelegationFormSelect,
  DelegationSubmitGroups,
} from "./DelegationFormParts";

interface Props {
  address: string;
  ens: string | null | undefined;
  originalDelegator: string;
  collection: DelegationCollection;
  showAddMore: boolean;
  onHide(): any;
  onSetToast(toast: any): any;
}

export default function RevokeDelegationWithSubComponent(
  props: Readonly<Props>
) {
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>("0");
  const [newDelegationUseCase, setNewDelegationUseCase] = useState<number>(0);
  const [newDelegationUseCaseDisplay, setNewDelegationUseCaseDisplay] =
    useState("");

  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const orignalDelegatorEnsResolution = useEnsName({
    address: props.originalDelegator as `0x${string}`,
    chainId: 1,
  });

  const [gasError, setGasError] = useState<string>();

  const contractWriteDelegationConfigParams = {
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      props.originalDelegator,
      newDelegationCollection,
      newDelegationToAddress,
      newDelegationUseCase,
    ],
    functionName:
      validate().length === 0
        ? "revokeDelegationAddressUsingSubdelegation"
        : undefined,
    onSettled(data: any, error: any) {
      if (data) {
        setGasError(undefined);
      }
      if (error) {
        setGasError(getGasError(error));
      }
    },
  };

  function clearErrors() {
    setGasError(undefined);
  }

  function validate() {
    const newErrors: string[] = [];
    if (!props.originalDelegator || props.originalDelegator === "") {
      newErrors.push("Missing or invalid Original Delegator");
    }
    if (!newDelegationCollection || newDelegationCollection === "0") {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationUseCase) {
      newErrors.push("Missing or invalid Use Case");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    }

    return newErrors;
  }

  return (
    <div className="tw-w-full tw-p-0">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2">
        <div className="tw-w-10/12 tw-px-3 tw-pb-1 tw-pt-3">
          <h4>Revoke as Delegation Manager</h4>
        </div>
        <div className="tw-flex tw-w-2/12 tw-items-center tw-justify-end tw-px-3 tw-pb-1 tw-pt-3">
          <DelegationCloseButton onHide={props.onHide} title="Revocation" />
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <div className="tw-w-full tw-px-3">
          <form>
            <DelegationFormRow>
              <DelegationFormLabel
                title="Original Delegator"
                tooltip="Original Delegator of Sub Delegation - The address the delegation will be revoked for"
              />
              <DelegationFormField>
                <DelegationFormInput
                  aria-label="Original Delegator"
                  className={styles["formInputDisabled"]}
                  type="text"
                  value={
                    orignalDelegatorEnsResolution.data
                      ? `${orignalDelegatorEnsResolution.data} - ${props.originalDelegator}`
                      : `${props.originalDelegator}`
                  }
                  disabled
                />
              </DelegationFormField>
            </DelegationFormRow>
            <DelegationFormRow>
              <DelegationFormLabel
                title="Delegation Manager"
                tooltip="Address executing the revocation"
              />
              <DelegationFormField>
                <DelegationAddressDisabledInput
                  address={props.address}
                  ens={props.ens}
                  label="Delegation Manager"
                />
              </DelegationFormField>
            </DelegationFormRow>
            <DelegationFormCollectionFormGroup
              collection={newDelegationCollection}
              setCollection={setNewDelegationCollection}
              subdelegation={{
                originalDelegator: props.originalDelegator,
                collection: props.collection,
              }}
            />
            <DelegationFormDelegateAddressFormGroup
              setAddress={setNewDelegationToAddress}
              title="Revoke Address"
              tooltip="Revoke wallet Address"
            />
            <DelegationFormRow>
              <DelegationFormLabel
                title="Use Case"
                tooltip="Delegation Use Case"
              />
              <DelegationFormField>
                <DelegationFormSelect
                  aria-label="Use Case"
                  value={newDelegationUseCase}
                  onChange={(e) => {
                    const i = parseInt(e.target.value);
                    const display = ALL_USE_CASES.find((u) => u.use_case === i);
                    setNewDelegationUseCase(i);
                    setNewDelegationUseCaseDisplay(
                      display ? display.display : ""
                    );
                    clearErrors();
                  }}
                >
                  <option value={0} disabled>
                    Select Use Case
                  </option>
                  {ALL_USE_CASES.map((uc) => (
                    <option
                      key={`revoke-delegation-select-use-case-${uc.use_case}`}
                      value={uc.use_case}
                    >
                      #{uc.use_case} - {uc.display}
                    </option>
                  ))}
                </DelegationFormSelect>
              </DelegationFormField>
            </DelegationFormRow>
            <DelegationSubmitGroups
              title={`Revoking #${newDelegationUseCase} - ${newDelegationUseCaseDisplay} as Delegation Manager`}
              writeParams={contractWriteDelegationConfigParams}
              showCancel={true}
              gasError={gasError}
              validate={validate}
              onHide={props.onHide}
              onSetToast={props.onSetToast}
              submitBtnLabel={"Revoke"}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
