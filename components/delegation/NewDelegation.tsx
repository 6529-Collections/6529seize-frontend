"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  findDelegationCollectionOption,
  findDelegationUseCaseOption,
  getDelegationCollectionOptions,
} from "./delegation-options";
import DelegationRegistrationSummary, {
  type DelegationRegistration,
} from "./DelegationRegistrationSummary";
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
  const collectionOptions = getDelegationCollectionOptions(props.subdelegation);
  // Link presets seed a field only when they match one of its options;
  // anything else leaves the field on its "Select" placeholder.
  const [newDelegationUseCase, setNewDelegationUseCase] = useState<number>(
    () => findDelegationUseCaseOption(props.use_case_query)?.use_case ?? 0
  );
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>(
      () =>
        findDelegationCollectionOption(
          props.collection_query,
          collectionOptions
        )?.contract ?? "0"
    );

  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const [gasError, setGasError] = useState<string>();
  const handleWriteSettled: DelegationWriteSettledHandler = (_data, error) => {
    setGasError(error ? getGasError(error) : undefined);
  };

  // The write and the summary above the submit button both read this one
  // object, so the summary always shows exactly what will be signed. It may
  // be incomplete; the write is enabled only once validate() passes.
  const registration: DelegationRegistration = {
    originalDelegator: props.subdelegation?.originalDelegator,
    collection: newDelegationCollection,
    delegate: newDelegationToAddress,
    expiry: showExpiryCalendar ? newDelegationExpiry.expiresAt : NEVER_DATE,
    useCase: newDelegationUseCase,
    allTokens: !showTokensInput,
    tokenId: showTokensInput ? newDelegationToken : 0,
  };
  const registrationArgs = [
    registration.collection,
    registration.delegate,
    // A missing date fails validate(), so this fallback is never signed.
    registration.expiry ?? NEVER_DATE,
    registration.useCase,
    registration.allTokens,
    registration.tokenId,
  ];
  const canWrite = validate().length === 0;
  const contractWriteDelegationConfigParams = props.subdelegation
    ? {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [props.subdelegation.originalDelegator, ...registrationArgs],
        functionName: canWrite
          ? "registerDelegationAddressUsingSubDelegation"
          : undefined,
      }
    : {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: registrationArgs,
        functionName: canWrite ? "registerDelegationAddress" : undefined,
      };

  const signerLabel = t(
    locale,
    props.subdelegation
      ? "delegation.register.manager.label"
      : "delegation.register.delegator.label"
  );

  function clearErrors() {
    setGasError(undefined);
  }

  function validate(submittedAtMs?: number) {
    const newErrors: string[] = [];
    if (
      !findDelegationCollectionOption(
        newDelegationCollection,
        collectionOptions
      )
    ) {
      newErrors.push(t(locale, "delegation.register.error.collection"));
    }
    if (!findDelegationUseCaseOption(newDelegationUseCase)) {
      newErrors.push(t(locale, "delegation.register.error.useCase"));
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push(t(locale, "delegation.register.error.address"));
    } else if (
      (props.subdelegation &&
        newDelegationToAddress.toUpperCase() ===
          props.subdelegation.originalDelegator?.toUpperCase()) ||
      (!props.subdelegation &&
        newDelegationToAddress.toUpperCase() === props.address.toUpperCase())
    ) {
      newErrors.push(t(locale, "delegation.register.error.ownWallet"));
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
      newErrors.push(t(locale, "delegation.register.error.tokenId"));
    }

    return newErrors;
  }

  return (
    <DelegationFormShell
      title={t(
        locale,
        props.subdelegation
          ? "delegation.register.titleAsManager"
          : "delegation.register.title"
      )}
      description={t(locale, "delegation.register.description")}
      closeTitle={t(locale, "delegation.register.closeTitle")}
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
            title={signerLabel}
            tooltip={t(
              locale,
              props.subdelegation
                ? "delegation.register.manager.tooltip"
                : "delegation.register.delegator.tooltip"
            )}
          />
          <DelegationFormField>
            <DelegationAddressDisabledInput
              address={props.address}
              ens={props.ens}
              label={signerLabel}
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
          title={t(locale, "delegation.register.delegate.label")}
          tooltip={t(locale, "delegation.register.delegate.tooltip")}
        />
        <DelegationFormRow>
          <DelegationFormLabel
            title={t(locale, "delegation.register.useCase.label")}
            tooltip={t(locale, "delegation.register.useCase.tooltip")}
          />
          <DelegationFormField>
            <DelegationFormSelect
              aria-label={t(locale, "delegation.register.useCase.label")}
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
                {t(locale, "delegation.register.useCase.placeholder")}
              </option>
              {DELEGATION_USE_CASES.map((uc) => {
                return (
                  <option
                    key={`add-delegation-select-use-case-${uc.use_case}`}
                    value={uc.use_case}
                  >
                    {t(locale, "delegation.register.useCase.option", {
                      number: uc.use_case,
                      name: uc.display,
                    })}
                  </option>
                );
              })}
            </DelegationFormSelect>
          </DelegationFormField>
        </DelegationFormRow>
        <DelegationFormRow>
          <DelegationFormLabel
            title={t(locale, "delegation.register.expiry.label")}
            tooltip={t(locale, "delegation.register.expiry.tooltip")}
          />
          <DelegationFormField>
            <DelegationRadio
              checked={!showExpiryCalendar}
              label={t(locale, "delegation.register.expiry.never")}
              name="expiryRadio"
              onChange={() => setShowExpiryCalendar(false)}
            />
            <DelegationRadio
              checked={showExpiryCalendar}
              label={t(locale, "delegation.register.expiry.selectDate")}
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
            title={t(locale, "delegation.register.tokens.label")}
            tooltip={t(locale, "delegation.register.tokens.tooltip")}
          />
          <DelegationFormField>
            <DelegationRadio
              checked={!showTokensInput}
              label={t(locale, "delegation.register.tokens.all")}
              name="tokenIdRadio"
              onChange={() => setShowTokensInput(false)}
            />
            <DelegationRadio
              checked={showTokensInput}
              label={t(locale, "delegation.register.tokens.selectTokenId")}
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
            {t(locale, "delegation.register.supportedUseCases.note")}{" "}
            <Link
              href={`/safe-collecting/faq/use-cases-overview`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(
                locale,
                "delegation.register.supportedUseCases.link"
              )}
            >
              <FontAwesomeIcon
                aria-hidden="true"
                className="hover:tw-text-primary-200 tw-ml-2 tw-h-4 tw-w-4 tw-text-primary-300 tw-transition-colors"
                icon={faInfoCircle}
              ></FontAwesomeIcon>
            </Link>
          </div>
        </DelegationFormRow>
        <DelegationRegistrationSummary
          registration={registration}
          collectionOptions={collectionOptions}
        />
        <DelegationSubmitGroups
          title={t(locale, "delegation.register.submit.progressTitle")}
          writeParams={contractWriteDelegationConfigParams}
          showCancel={true}
          gasError={gasError}
          onWriteSettled={handleWriteSettled}
          validate={validate}
          onHide={props.onHide}
          onSetToast={props.onSetToast}
          submitBtnLabel={t(locale, "delegation.register.submit.label")}
        />
      </form>
    </DelegationFormShell>
  );
}
