"use client";

import { useState } from "react";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import type { DelegationCollection } from "./delegation-constants";
import { SUB_DELEGATION_USE_CASE } from "./delegation-constants";
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
  DelegationFormLabel,
  DelegationFormOriginalDelegatorFormGroup,
  DelegationFormRow,
  DelegationFormShell,
  DelegationSubmitGroups,
} from "./DelegationFormParts";

interface Props {
  address: string;
  subdelegation?:
    | {
        originalDelegator: string;
        collection: DelegationCollection;
      }
    | undefined;
  ens: string | null | undefined;
  onHide(): void;
  onSetToast(toast: DelegationToastState): void;
}

export default function NewSubDelegationComponent(props: Readonly<Props>) {
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>("0");

  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const [gasError, setGasError] = useState<string>();
  const handleWriteSettled: DelegationWriteSettledHandler = (_data, error) => {
    setGasError(error ? getGasError(error) : undefined);
  };

  const contractWriteDelegationConfigParams = props.subdelegation
    ? {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          props.subdelegation.originalDelegator,
          newDelegationCollection,
          newDelegationToAddress,
          NEVER_DATE,
          SUB_DELEGATION_USE_CASE.use_case,
          true,
          0,
        ],
        functionName:
          validate().length === 0
            ? "registerDelegationAddressUsingSubDelegation"
            : undefined,
      }
    : {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          newDelegationCollection,
          newDelegationToAddress,
          NEVER_DATE,
          SUB_DELEGATION_USE_CASE.use_case,
          true,
          0,
        ],
        functionName:
          validate().length === 0 ? "registerDelegationAddress" : undefined,
      };

  function validate() {
    const newErrors: string[] = [];
    if (!newDelegationCollection || newDelegationCollection === "0") {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    } else if (
      (props.subdelegation &&
        newDelegationToAddress.toUpperCase() ===
          props.subdelegation.originalDelegator.toUpperCase()) ||
      (!props.subdelegation &&
        newDelegationToAddress.toUpperCase() === props.address.toUpperCase())
    ) {
      newErrors.push("Invalid Address - cannot delegate to your own wallet");
    }

    return newErrors;
  }

  return (
    <DelegationFormShell
      title="Register Delegation Manager (Sub-Delegation)"
      description="Grant a manager wallet permission to maintain delegations and consolidations for the managed wallet."
      closeTitle="Delegation Manager"
      onHide={props.onHide}
    >
      <form>
        {props.subdelegation && (
          <DelegationFormOriginalDelegatorFormGroup
            subdelegation={props.subdelegation}
          />
        )}
        <DelegationFormRow>
          <DelegationFormLabel
            title={props.subdelegation ? "Manager Wallet" : "Managed Wallet"}
            tooltip={`Address ${
              props.subdelegation ? `executing` : `registering`
            } the sub-delegation`}
          />
          <DelegationFormField>
            <DelegationAddressDisabledInput
              address={props.address}
              ens={props.ens}
              label={props.subdelegation ? "Delegation Manager" : "Delegator"}
            />
          </DelegationFormField>
        </DelegationFormRow>
        <DelegationFormCollectionFormGroup
          collection={newDelegationCollection}
          setCollection={setNewDelegationCollection}
          subdelegation={props.subdelegation}
        />
        <DelegationFormDelegateAddressFormGroup
          setAddress={setNewDelegationToAddress}
          title="Manager Address"
          tooltip="Wallet that can manage delegations and consolidations for the selected collection"
        />
        <DelegationSubmitGroups
          title={"Registering Delegation Manager"}
          writeParams={contractWriteDelegationConfigParams}
          showCancel={true}
          gasError={gasError}
          onWriteSettled={handleWriteSettled}
          validate={validate}
          onHide={props.onHide}
          onSetToast={props.onSetToast}
          submitBtnLabel="Register Delegation Manager"
        />
      </form>
    </DelegationFormShell>
  );
}
