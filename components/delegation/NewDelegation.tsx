"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import type { DelegationCollection } from "./delegation-constants";
import { DELEGATION_USE_CASES } from "./delegation-constants";
import { getGasError } from "./delegation-shared";
import styles from "./Delegation.module.scss";
import {
  DelegationAddressDisabledInput,
  DelegationCloseButton,
  DelegationExpiryCalendar,
  DelegationFormField,
  DelegationFormCollectionFormGroup,
  DelegationFormDelegateAddressFormGroup,
  DelegationFormLabel,
  DelegationFormOriginalDelegatorFormGroup,
  DelegationFormRow,
  DelegationFormSelect,
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
  setCollectionQuery?(collection: string): any;
  use_case_query?: number | undefined;
  setUseCaseQuery?(useCase: number): any;
  onHide(): any;
  onSetToast(toast: any): any;
}

export default function NewDelegationComponent(props: Readonly<Props>) {
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [showTokensInput, setShowTokensInput] = useState(false);

  const [newDelegationDate, setNewDelegationDate] = useState<Date | undefined>(
    undefined
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

  const contractWriteDelegationConfigParams = props.subdelegation
    ? {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          props.subdelegation.originalDelegator,
          newDelegationCollection,
          newDelegationToAddress,
          showExpiryCalendar && newDelegationDate
            ? newDelegationDate.getTime() / 1000
            : NEVER_DATE,
          newDelegationUseCase,
          !showTokensInput,
          showTokensInput ? newDelegationToken : 0,
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
          showExpiryCalendar && newDelegationDate
            ? newDelegationDate.getTime() / 1000
            : NEVER_DATE,
          newDelegationUseCase,
          !showTokensInput,
          showTokensInput ? newDelegationToken : 0,
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

  function clearErrors() {
    setGasError(undefined);
  }

  function validate() {
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
        newDelegationToAddress?.toUpperCase() ==
          props.subdelegation.originalDelegator?.toUpperCase()) ||
      (!props.subdelegation &&
        newDelegationToAddress?.toUpperCase() === props.address?.toUpperCase())
    ) {
      newErrors.push("Invalid Address - cannot delegate to your own wallet");
    }
    if (showExpiryCalendar && !newDelegationDate) {
      newErrors.push("Missing or invalid Expiry");
    }
    if (showTokensInput && !newDelegationToken) {
      newErrors.push("Missing or invalid Token ID");
    }

    return newErrors;
  }

  return (
    <div className="tw-w-full tw-px-3">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-10/12 tw-px-3 tw-pb-1 tw-pt-3">
          <h4>
            Register Delegation {props.subdelegation && `as Delegation Manager`}
          </h4>
          <p className={styles["actionIntro"]}>
            Register utility rights for another wallet. NFTs stay in the
            delegator wallet.
          </p>
        </div>
        <div className="tw-flex tw-w-2/12 tw-items-center tw-justify-end tw-px-3 tw-pb-1 tw-pt-3">
          <DelegationCloseButton onHide={props.onHide} title="Delegation" />
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
                title={props.subdelegation ? "Delegation Manager" : "Delegator"}
                tooltip={`Address ${
                  props.subdelegation ? `executing` : `registering`
                } the delegation`}
              />
              <DelegationFormField>
                <DelegationAddressDisabledInput
                  address={props.address}
                  ens={props.ens}
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
              <DelegationFormLabel
                title="Use Case"
                tooltip="Delegation Use Case"
              />
              <DelegationFormField>
                <DelegationFormSelect
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
                &nbsp;&nbsp;
                <DelegationRadio
                  checked={showExpiryCalendar}
                  label="Select Date"
                  name="expiryRadio"
                  onChange={() => setShowExpiryCalendar(true)}
                />
                {showExpiryCalendar && (
                  <DelegationExpiryCalendar
                    setDelegationDate={setNewDelegationDate}
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
                &nbsp;&nbsp;
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
              <div className="tw-flex tw-items-center sm:tw-col-span-12">
                Note: The currently supported use cases on 6529.io are: #1 -
                All, #2 - Minting/Allowlist, #3 - Airdrops{" "}
                <Link
                  href={`/delegation/delegation-faq/use-cases-overview`}
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
              title={"Registering Delegation"}
              writeParams={contractWriteDelegationConfigParams}
              showCancel={true}
              gasError={gasError}
              validate={validate}
              onHide={props.onHide}
              onSetToast={props.onSetToast}
              submitBtnLabel="Register Delegation"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
