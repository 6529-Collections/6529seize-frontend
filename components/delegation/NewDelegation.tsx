"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import type { DelegationCollection } from "./delegation-constants";
import { DELEGATION_USE_CASES } from "./delegation-constants";
import {
  EMPTY_DELEGATION_EXPIRY,
  getDelegationExpiryError,
} from "./delegation-expiry";
import {
  getGasError,
  type DelegationWriteSettledHandler,
} from "./delegation-shared";
import type { DelegationToastState } from "./DelegationToast";
import {
  DelegationAddressDisabledInput,
  DelegationExpiryCalendar,
  DelegationFormField,
  DelegationFormCollectionFormGroup,
  DelegationFormDelegateAddressFormGroup,
  DelegationFormLabel,
  DelegationFormOriginalDelegatorFormGroup,
  DelegationFormRow,
  DelegationFormSelect,
  DelegationFormShell,
  DelegationRadio,
  DelegationSubmitGroups,
  DelegationTokenSelection,
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
  collection_query?: string | undefined;
  setCollectionQuery?(collection: string): void;
  use_case_query?: number | undefined;
  setUseCaseQuery?(useCase: number): void;
  onHide(): void;
  onSetToast(toast: DelegationToastState): void;
}

export default function NewDelegationComponent(props: Readonly<Props>) {
  const locale = useBrowserLocale();
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [showTokensInput, setShowTokensInput] = useState(false);

  const [newDelegationExpiry, setNewDelegationExpiry] = useState(
    EMPTY_DELEGATION_EXPIRY
  );
  const [newDelegationToken, setNewDelegationToken] = useState<
    number | undefined
  >(undefined);
  const [newDelegationUseCase, setNewDelegationUseCase] = useState<number>(
    props.use_case_query ?? 0
  );
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>(props.collection_query ?? "0");

  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const [gasError, setGasError] = useState<string>();
  const handleWriteSettled: DelegationWriteSettledHandler = (_data, error) => {
    setGasError(error ? getGasError(error) : undefined);
  };

  const expiryArg =
    showExpiryCalendar && newDelegationExpiry.expiresAt !== null
      ? newDelegationExpiry.expiresAt
      : NEVER_DATE;
  const contractWriteDelegationConfigParams = props.subdelegation
    ? {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          props.subdelegation.originalDelegator,
          newDelegationCollection,
          newDelegationToAddress,
          expiryArg,
          newDelegationUseCase,
          !showTokensInput,
          showTokensInput ? newDelegationToken : 0,
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
          expiryArg,
          newDelegationUseCase,
          !showTokensInput,
          showTokensInput ? newDelegationToken : 0,
        ],
        functionName:
          validate().length === 0 ? "registerDelegationAddress" : undefined,
      };

  function clearErrors() {
    setGasError(undefined);
  }

  function validate(submittedAtMs?: number) {
    const newErrors: string[] = [];
    if (!newDelegationCollection || newDelegationCollection === "0") {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationUseCase) {
      newErrors.push("Missing or invalid Use Case");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    } else if (
      (props.subdelegation &&
        newDelegationToAddress.toUpperCase() ===
          props.subdelegation.originalDelegator?.toUpperCase()) ||
      (!props.subdelegation &&
        newDelegationToAddress.toUpperCase() === props.address.toUpperCase())
    ) {
      newErrors.push("Invalid Address - cannot delegate to your own wallet");
    }
    const expiryError = showExpiryCalendar
      ? getDelegationExpiryError(
          locale,
          newDelegationExpiry.expiresAt,
          submittedAtMs
        )
      : null;
    if (expiryError) {
      newErrors.push(expiryError);
    }
    if (showTokensInput && !newDelegationToken) {
      newErrors.push("Missing or invalid Token ID");
    }

    return newErrors;
  }

  return (
    <DelegationFormShell
      title={`Register Delegation${
        props.subdelegation ? " as Delegation Manager" : ""
      }`}
      description="Register utility rights for another wallet. NFTs stay in the delegator wallet."
      closeTitle="Delegation"
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
            title={props.subdelegation ? "Delegation Manager" : "Delegator"}
            tooltip={`Address ${
              props.subdelegation ? `executing` : `registering`
            } the delegation`}
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
          setCollection={(c: string) => {
            setNewDelegationCollection(c);
            if (props.setCollectionQuery) {
              props.setCollectionQuery(c);
            }
          }}
          subdelegation={props.subdelegation}
        />
        <DelegationFormDelegateAddressFormGroup
          setAddress={setNewDelegationToAddress}
          title="Delegate Address"
          tooltip="Delegate to Address e.g. your hot wallet"
        />
        <DelegationFormRow>
          <DelegationFormLabel title="Use Case" tooltip="Delegation Use Case" />
          <DelegationFormField>
            <DelegationFormSelect
              aria-label="Use Case"
              value={newDelegationUseCase}
              onChange={(e) => {
                const newCase = parseInt(e.target.value);
                setNewDelegationUseCase(newCase);
                if (props.setUseCaseQuery) {
                  props.setUseCaseQuery(newCase);
                }
                clearErrors();
              }}
            >
              <option value={0} disabled>
                Select Use Case
              </option>
              {DELEGATION_USE_CASES.map((uc) => {
                return (
                  <option
                    key={`add-delegation-select-use-case-${uc.use_case}`}
                    value={uc.use_case}
                  >
                    #{uc.use_case} - {uc.display}
                  </option>
                );
              })}
            </DelegationFormSelect>
          </DelegationFormField>
        </DelegationFormRow>
        <DelegationFormRow>
          <DelegationFormLabel
            title="Expiry Date"
            tooltip="Expiry date for delegation (optional)"
          />
          <DelegationFormField>
            <DelegationRadio
              checked={!showExpiryCalendar}
              label="Never"
              name="expiryRadio"
              onChange={() => setShowExpiryCalendar(false)}
            />
            <DelegationRadio
              checked={showExpiryCalendar}
              label="Select Date"
              name="expiryRadio"
              onChange={() => setShowExpiryCalendar(true)}
            />
            {showExpiryCalendar && (
              <DelegationExpiryCalendar
                value={newDelegationExpiry}
                onChange={setNewDelegationExpiry}
              />
            )}
          </DelegationFormField>
        </DelegationFormRow>
        <DelegationFormRow>
          <DelegationFormLabel
            title="Tokens"
            tooltip="Tokens involved in the delegation (optional)"
          />
          <DelegationFormField>
            <DelegationRadio
              checked={!showTokensInput}
              label="All"
              name="tokenIdRadio"
              onChange={() => setShowTokensInput(false)}
            />
            <DelegationRadio
              checked={showTokensInput}
              label="Select Token ID"
              name="tokenIdRadio"
              onChange={() => setShowTokensInput(true)}
            />
            {showTokensInput && (
              <DelegationTokenSelection
                setDelegationToken={setNewDelegationToken}
              />
            )}
          </DelegationFormField>
        </DelegationFormRow>
        <DelegationFormRow>
          <div className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-col-span-12">
            Note: The currently supported use cases on 6529.io are: #1 - All, #2
            - Minting/Allowlist, #3 - Airdrops{" "}
            <Link
              href={`/safe-collecting/faq/use-cases-overview`}
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
          title={"Registering Delegation"}
          writeParams={contractWriteDelegationConfigParams}
          showCancel={true}
          gasError={gasError}
          onWriteSettled={handleWriteSettled}
          validate={validate}
          onHide={props.onHide}
          onSetToast={props.onSetToast}
          submitBtnLabel="Register Delegation"
        />
      </form>
    </DelegationFormShell>
  );
}
