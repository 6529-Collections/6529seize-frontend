"use client";

import { useState } from "react";
import { useEnsName } from "wagmi";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import type { DelegationCollection } from "./delegation-constants";
import { ALL_USE_CASES } from "./delegation-constants";
import {
  getGasError,
  type DelegationWriteSettledHandler,
} from "./delegation-shared";
import type { DelegationToastState } from "./DelegationToast";
import {
  DelegationAddressDisabledInput,
  DelegationFormField,
  DelegationFormCollectionFormGroup,
  DelegationFormDelegateAddressFormGroup,
  DelegationFormInput,
  DelegationFormLabel,
  DelegationFormRow,
  DelegationFormSelect,
  DelegationFormShell,
  DelegationSubmitGroups,
} from "./DelegationFormParts";

interface Props {
  address: string;
  ens: string | null | undefined;
  originalDelegator: string;
  collection: DelegationCollection;
  showAddMore: boolean;
  onHide(): void;
  onSetToast(toast: DelegationToastState): void;
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
  const handleWriteSettled: DelegationWriteSettledHandler = (_data, error) => {
    setGasError(error ? getGasError(error) : undefined);
  };

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
    <DelegationFormShell
      title="Revoke as Delegation Manager"
      description="Remove a delegation record on behalf of the selected managed wallet."
      closeTitle="Revocation"
      onHide={props.onHide}
    >
      <form>
        <DelegationFormRow>
          <DelegationFormLabel
            title="Original Delegator"
            tooltip="Original Delegator of Sub Delegation - The address the delegation will be revoked for"
          />
          <DelegationFormField>
            <DelegationFormInput
              aria-label="Original Delegator"
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
          <DelegationFormLabel title="Use Case" tooltip="Delegation Use Case" />
          <DelegationFormField>
            <DelegationFormSelect
              aria-label="Use Case"
              value={newDelegationUseCase}
              onChange={(e) => {
                const i = parseInt(e.target.value);
                const display = ALL_USE_CASES.find((u) => u.use_case === i);
                setNewDelegationUseCase(i);
                setNewDelegationUseCaseDisplay(display ? display.display : "");
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
          onWriteSettled={handleWriteSettled}
          isDestructive
          validate={validate}
          onHide={props.onHide}
          onSetToast={props.onSetToast}
          submitBtnLabel={"Revoke"}
        />
      </form>
    </DelegationFormShell>
  );
}
