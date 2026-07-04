"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import type { DelegationCollection } from "./delegation-constants";
import { CONSOLIDATION_USE_CASE } from "./delegation-constants";
import { getGasError } from "./delegation-shared";
import styles from "./Delegation.module.css";
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

export default function NewConsolidationComponent(props: Readonly<Props>) {
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
          CONSOLIDATION_USE_CASE.use_case,
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
          CONSOLIDATION_USE_CASE.use_case,
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
          <h4>
            Register Consolidation{" "}
            {props.subdelegation && `as Delegation Manager`}
          </h4>
          <p className={styles["actionIntro"]}>
            Register an ownership link between wallets you control. NFTs stay
            where they are.
          </p>
        </div>
        <div className="tw-flex tw-w-2/12 tw-items-center tw-justify-end tw-px-3 tw-pb-1 tw-pt-3">
          <DelegationCloseButton onHide={props.onHide} title="Consolidation" />
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
                title={props.subdelegation ? `Delegation Manager` : `Delegator`}
                tooltip={`Address ${
                  props.subdelegation ? `executing` : `registering`
                } the consolidation`}
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
              consolidation
            />
            <DelegationFormDelegateAddressFormGroup
              setAddress={setNewDelegationToAddress}
              title="Consolidating With"
              tooltip="Consolidate with Address e.g. your hot wallet"
            />
            <DelegationFormRow>
              <div className="tw-flex tw-items-center sm:tw-col-span-12">
                Note: For TDH Consolidation use either &apos;Any
                Collection&apos; or &apos;The Memes&apos;
                <Link
                  href={`/delegation/delegation-faq/register-consolidation`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FontAwesomeIcon
                    className={styles["infoIconLink"]}
                    icon={faInfoCircle}
                  ></FontAwesomeIcon>
                </Link>
              </div>
            </DelegationFormRow>
            <DelegationSubmitGroups
              title={"Registering Consolidation"}
              writeParams={contractWriteDelegationConfigParams}
              showCancel={true}
              gasError={gasError}
              validate={validate}
              onHide={props.onHide}
              onSetToast={props.onSetToast}
              submitBtnLabel="Register Consolidation"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
