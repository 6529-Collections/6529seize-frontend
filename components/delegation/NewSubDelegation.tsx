"use client";

import { useState } from "react";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import type { DelegationCollection } from "./delegation-constants";
import { SUB_DELEGATION_USE_CASE } from "./delegation-constants";
import { getGasError } from "./delegation-shared";
import styles from "./Delegation.module.scss";
import {
  DelegationAddressDisabledInput,
  DelegationCloseButton,
  DelegationFormField,
  DelegationFormCollectionFormGroup,
  DelegationFormDelegateAddressFormGroup,
  DelegationFormLabel,
  DelegationFormOriginalDelegatorFormGroup,
  DelegationFormRow,
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
  onHide(): any;
  onSetToast(toast: any): any;
}

export default function NewSubDelegationComponent(props: Readonly<Props>) {
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>("0");

  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const [gasError, setGasError] = useState<string>();

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
        onSettled(data: any, error: any) {
          if (data) {
            setGasError(undefined);
          }
          if (error) {
            setGasError(getGasError(error));
          }
        },
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
    if (!newDelegationCollection || newDelegationCollection === "0") {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    } else if (
      (props.subdelegation &&
        newDelegationToAddress.toUpperCase() ==
          props.subdelegation.originalDelegator.toUpperCase()) ||
      (!props.subdelegation &&
        newDelegationToAddress.toUpperCase() === props.address.toUpperCase())
    ) {
      newErrors.push("Invalid Address - cannot delegate to your own wallet");
    }

    return newErrors;
  }

  return (
    <div className="tw-w-full tw-px-3">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-10/12 tw-px-3 tw-pb-1 tw-pt-3">
          <h4>Register Delegation Manager (Sub-Delegation)</h4>
          <p className={styles["actionIntro"]}>
            Grant a manager wallet permission to maintain delegations and
            consolidations for the managed wallet.
          </p>
        </div>
        <div className="tw-flex tw-w-2/12 tw-items-center tw-justify-end tw-px-3 tw-pb-1 tw-pt-3">
          <DelegationCloseButton
            onHide={props.onHide}
            title="Delegation Manager"
          />
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <div className="tw-w-full tw-px-3">
          <form>
            {props.subdelegation && (
              <DelegationFormOriginalDelegatorFormGroup
                subdelegation={props.subdelegation}
              />
            )}
            <DelegationFormRow>
              <DelegationFormLabel
                title={
                  props.subdelegation ? "Manager Wallet" : "Managed Wallet"
                }
                tooltip={`Address ${
                  props.subdelegation ? `executing` : `registering`
                } the sub-delegation`}
              />
              <DelegationFormField>
                <DelegationAddressDisabledInput
                  address={props.address}
                  ens={props.ens}
                  label={
                    props.subdelegation ? "Delegation Manager" : "Delegator"
                  }
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
              validate={validate}
              onHide={props.onHide}
              onSetToast={props.onSetToast}
              submitBtnLabel="Register Delegation Manager"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
