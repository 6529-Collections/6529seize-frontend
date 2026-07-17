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

export default function NewConsolidationComponent(props: Readonly<Props>) {
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
          CONSOLIDATION_USE_CASE.use_case,
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
          CONSOLIDATION_USE_CASE.use_case,
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
      title={`Register Consolidation${
        props.subdelegation ? " as Delegation Manager" : ""
      }`}
      description="Register an ownership link between wallets you control. NFTs stay where they are."
      closeTitle="Consolidation"
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
            title={props.subdelegation ? `Delegation Manager` : `Delegator`}
            tooltip={`Address ${
              props.subdelegation ? `executing` : `registering`
            } the consolidation`}
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
          consolidation
        />
        <DelegationFormDelegateAddressFormGroup
          setAddress={setNewDelegationToAddress}
          title="Consolidating With"
          tooltip="Consolidate with Address e.g. your hot wallet"
        />
        <DelegationFormRow>
          <div className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-col-span-12">
            Note: For TDH Consolidation use either &apos;Any Collection&apos; or
            &apos;The Memes&apos;
            <Link
              href={`/delegation/delegation-faq/register-consolidation`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon
                className="hover:tw-text-primary-200 tw-ml-2 tw-h-4 tw-w-4 tw-text-primary-300 tw-transition-colors"
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
          onWriteSettled={handleWriteSettled}
          validate={validate}
          onHide={props.onHide}
          onSetToast={props.onSetToast}
          submitBtnLabel="Register Consolidation"
        />
      </form>
    </DelegationFormShell>
  );
}
