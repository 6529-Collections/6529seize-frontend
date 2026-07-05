"use client";

import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { areEqualAddresses, getTransactionLink } from "@/helpers/Helpers";
import { useEnsResolution } from "@/hooks/useEnsResolution";
import { faInfoCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useEffect,
  useEffectEvent,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Tooltip } from "react-tooltip";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { DelegationCollection } from "./delegation-constants";
import { SUPPORTED_COLLECTIONS } from "./delegation-constants";
import type { DelegationWriteParams } from "./delegation-shared";
import { useOrignalDelegatorEnsResolution } from "./delegation-shared";
import styles from "./Delegation.module.css";

const FORM_ROW_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-2 tw-pb-4 sm:tw-grid-cols-12 sm:tw-gap-4";
const FORM_ROW_COMPACT_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-12 sm:tw-gap-4";
const INPUT_CLASS =
  "tw-block tw-w-full tw-min-w-0 tw-border tw-border-solid tw-border-iron-300 tw-bg-white tw-px-3 tw-py-2 tw-text-base tw-leading-6 tw-text-black focus:tw-border-primary-400 focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-opacity-75";
const RADIO_CLASS =
  "tw-mr-2 tw-h-4 tw-w-4 tw-cursor-pointer tw-border-0 tw-bg-white tw-text-black focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

function getLabelSpanClass(span: number) {
  if (span === 4) {
    return "sm:tw-col-span-4";
  }
  if (span === 12) {
    return "sm:tw-col-span-12";
  }
  return "sm:tw-col-span-3";
}

function getFieldSpanClass(span: number) {
  if (span === 8) {
    return "sm:tw-col-span-8";
  }
  if (span === 12) {
    return "sm:tw-col-span-12";
  }
  return "sm:tw-col-span-9";
}

export function DelegationFormRow(
  props: Readonly<{ children: ReactNode; className?: string | undefined }>
) {
  return (
    <div className={`${FORM_ROW_CLASS} ${props.className ?? ""}`}>
      {props.children}
    </div>
  );
}

export function DelegationFormField(
  props: Readonly<{
    children: ReactNode;
    span?: 8 | 9 | 12 | undefined;
    className?: string | undefined;
  }>
) {
  return (
    <div
      className={`${getFieldSpanClass(props.span ?? 9)} ${
        props.className ?? ""
      }`}
    >
      {props.children}
    </div>
  );
}

export function DelegationFormInput(props: ComponentPropsWithoutRef<"input">) {
  const { className, ...inputProps } = props;
  return (
    <input
      {...inputProps}
      className={`${styles["formInput"]} ${INPUT_CLASS} ${className ?? ""}`}
    />
  );
}

export function DelegationFormSelect(
  props: ComponentPropsWithoutRef<"select">
) {
  const { className, children, ...selectProps } = props;
  return (
    <select
      {...selectProps}
      className={`${styles["formInput"]} ${INPUT_CLASS} ${className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function DelegationRadio(
  props: Readonly<
    ComponentPropsWithoutRef<"input"> & {
      label: ReactNode;
    }
  >
) {
  const { label, className, ...inputProps } = props;
  return (
    <label
      className={`${styles["newDelegationFormToggle"]} tw-inline-flex tw-items-center ${className ?? ""}`}
    >
      <input {...inputProps} type="radio" className={RADIO_CLASS} />
      <span>{label}</span>
    </label>
  );
}

function getTransactionErrorToastMessage(
  error: { message?: string } | null | undefined,
  fallback: string
) {
  const message = error?.message?.split("Request Arguments")[0]?.trim();
  return message || fallback;
}

function DelegationAddressInput(
  props: Readonly<{ label: string; setAddress: (address: string) => void }>
) {
  const { setAddress } = props;
  const { inputValue, address, handleInputChange } = useEnsResolution({
    chainId: 1,
  });

  useEffect(() => {
    setAddress(address);
  }, [setAddress, address]);

  return (
    <DelegationFormInput
      aria-label={props.label}
      placeholder={"0x... or ENS"}
      type="text"
      value={inputValue}
      onChange={(e) => {
        handleInputChange(e.target.value);
      }}
    />
  );
}

export function DelegationFormLabel(
  props: Readonly<{ title: string; tooltip: string; span?: number | undefined }>
) {
  const tooltipId = `delegation-form-label-${props.title
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <label
      className={`tw-flex tw-items-center ${getLabelSpanClass(
        props.span ?? 3
      )}`}
    >
      {props.title}
      <FontAwesomeIcon
        className={styles["infoIcon"]}
        icon={faInfoCircle}
        data-tooltip-id={tooltipId}
      ></FontAwesomeIcon>
      <Tooltip
        id={tooltipId}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        {props.tooltip}
      </Tooltip>
    </label>
  );
}

export function DelegationFormOriginalDelegatorFormGroup(
  props: Readonly<{
    subdelegation: { originalDelegator: string };
  }>
) {
  const orignalDelegatorEnsResolution = useOrignalDelegatorEnsResolution({
    subdelegation: props.subdelegation,
  });

  return (
    <DelegationFormRow>
      <DelegationFormLabel
        title="Original Delegator"
        tooltip="Original Delegator of Sub Delegation - The address the delegation will be registed for"
      />
      <DelegationFormField>
        <DelegationFormInput
          aria-label="Original Delegator"
          className={styles["formInputDisabled"]}
          type="text"
          value={
            orignalDelegatorEnsResolution.data
              ? `${orignalDelegatorEnsResolution.data} - ${props.subdelegation.originalDelegator}`
              : `${props.subdelegation.originalDelegator}`
          }
          disabled
        />
      </DelegationFormField>
    </DelegationFormRow>
  );
}

export function DelegationAddressDisabledInput(
  props: Readonly<{
    address?: string | undefined;
    ens: string | null | undefined;
    label?: string | undefined;
  }>
) {
  const displayValue = props.address
    ? props.ens
      ? `${props.ens} - ${props.address}`
      : props.address
    : "Connect wallet to continue";

  return (
    <DelegationFormInput
      aria-label={props.label ?? "Address"}
      className={styles["formInputDisabled"]}
      type="text"
      value={displayValue}
      disabled
    />
  );
}

export function DelegationFormOptionsFormGroup(
  props: Readonly<{
    title: string;
    tooltip: string;
    options: string[];
    selected: string;
    setSelected: (s: string) => void;
  }>
) {
  return (
    <DelegationFormRow>
      <DelegationFormLabel title={props.title} tooltip={props.tooltip} />
      <DelegationFormField>
        <DelegationFormSelect
          aria-label={props.title}
          value={props.selected}
          onChange={(e) => props.setSelected(e.target.value)}
        >
          <option value="" disabled>
            Select
          </option>
          {props.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </DelegationFormSelect>
      </DelegationFormField>
    </DelegationFormRow>
  );
}

export function DelegationFormCollectionFormGroup(
  props: Readonly<{
    collection: string;
    setCollection: (collection: string) => void;
    subdelegation?:
      | {
          originalDelegator: string;
          collection: DelegationCollection;
        }
      | undefined;
    consolidation?: boolean | undefined;
  }>
) {
  const collections =
    !props.subdelegation ||
    areEqualAddresses(
      props.subdelegation.collection.contract,
      DELEGATION_ALL_ADDRESS
    )
      ? SUPPORTED_COLLECTIONS
      : [props.subdelegation.collection];

  return (
    <DelegationFormRow>
      <DelegationFormLabel
        title="Collection"
        tooltip={`Collection address for ${
          props.consolidation ? "consolidation" : "delegation"
        }`}
      />
      <DelegationFormField>
        <DelegationFormSelect
          aria-label="Collection"
          value={props.collection}
          onChange={(e) => props.setCollection(e.target.value)}
        >
          <option value="0" disabled>
            Select Collection
          </option>
          {collections.map((sc) => (
            <option
              key={`add-delegation-select-collection-${sc.contract}`}
              value={sc.contract}
            >
              {`${sc.display}`}
            </option>
          ))}
        </DelegationFormSelect>
      </DelegationFormField>
    </DelegationFormRow>
  );
}

export function DelegationFormDelegateAddressFormGroup(
  props: Readonly<{
    setAddress: (address: string) => void;
    title: string;
    tooltip: string;
  }>
) {
  return (
    <DelegationFormRow>
      <DelegationFormLabel title={props.title} tooltip={props.tooltip} />
      <DelegationFormField>
        <DelegationAddressInput
          label={props.title}
          setAddress={(address: string) => props.setAddress(address)}
        />
      </DelegationFormField>
    </DelegationFormRow>
  );
}

export function DelegationSubmitGroups(
  props: Readonly<{
    title: string;
    writeParams: DelegationWriteParams;
    showCancel: boolean;
    gasError?: string | undefined;
    validate: () => string[];
    onHide: () => void;
    onSetToast: (toast: { title: string; message: ReactNode }) => void;
    submitBtnLabel?: string | undefined;
  }>
) {
  const {
    title,
    writeParams,
    showCancel,
    gasError,
    validate,
    onHide,
    onSetToast,
    submitBtnLabel,
  } = props;
  const writeDelegation = useWriteContract();
  const waitWriteDelegation = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: writeDelegation.data,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const emitToast = useEffectEvent(
    (toast: { title: string; message: ReactNode }) => {
      onSetToast(toast);
    }
  );

  function submitDelegation() {
    const newErrors = validate();
    if (newErrors.length > 0 || gasError) {
      setErrors(newErrors);
      window.scrollBy(0, 100);
    } else {
      const { functionName } = writeParams;
      if (!functionName) {
        // Unreachable: submission is gated by the same validate() predicate
        // the form components use to decide whether functionName is set.
        return;
      }
      writeDelegation.writeContract({ ...writeParams, functionName });
      onSetToast({
        title,
        message: "Confirm in your wallet...",
      });
    }
  }

  function getTransactionAnchor(hash: `0x${string}`) {
    return (
      <a
        href={getTransactionLink(DELEGATION_CONTRACT.chain_id, hash)}
        target="_blank"
        rel="noopener noreferrer"
        className={styles["etherscanLink"]}
      >
        view
      </a>
    );
  }

  useEffect(() => {
    if (writeDelegation.error) {
      emitToast({
        title,
        message: getTransactionErrorToastMessage(
          writeDelegation.error,
          "Failed to start transaction."
        ),
      });
    }
    if (writeDelegation.data) {
      if (waitWriteDelegation.isLoading) {
        emitToast({
          title,
          message: (
            <>
              Transaction submitted...{" "}
              {getTransactionAnchor(writeDelegation.data)}
              <br />
              Waiting for confirmation...
            </>
          ),
        });
      } else if (waitWriteDelegation.isSuccess) {
        emitToast({
          title,
          message: (
            <>
              Transaction Successful!{" "}
              {getTransactionAnchor(writeDelegation.data)}
            </>
          ),
        });
      } else if (waitWriteDelegation.isError) {
        emitToast({
          title: `${title} Failed`,
          message: getTransactionErrorToastMessage(
            waitWriteDelegation.error,
            "Transaction failed while waiting for confirmation."
          ),
        });
      }
    }
  }, [
    writeDelegation.error,
    writeDelegation.data,
    waitWriteDelegation.error,
    waitWriteDelegation.isError,
    waitWriteDelegation.isLoading,
    waitWriteDelegation.isSuccess,
    title,
  ]);

  function isLoading() {
    return writeDelegation.isPending || waitWriteDelegation.isLoading;
  }

  return (
    <>
      <div className={`${FORM_ROW_COMPACT_CLASS} tw-pb-4 tw-pt-2`}>
        <div className="tw-hidden sm:tw-col-span-4 sm:tw-block"></div>
        <div className="tw-flex tw-items-center tw-justify-center sm:tw-col-span-8">
          {showCancel && (
            <button
              type="button"
              className={styles["newDelegationCancelBtn"]}
              onClick={() => onHide()}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={isLoading()}
            className={`${styles["newDelegationSubmitBtn"]} ${
              isLoading() ? `${styles["newDelegationSubmitBtnDisabled"]}` : ``
            }`}
            onClick={(e) => {
              e.preventDefault();
              submitDelegation();
            }}
          >
            {submitBtnLabel ?? "Submit"}{" "}
            {isLoading() && (
              <span className="tw-inline-block">
                <output
                  className={`${styles["loader"]} tw-inline-block tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-white/30 tw-border-t-white`}
                >
                  <span className="tw-sr-only">Transaction pending</span>
                </output>
              </span>
            )}
          </button>
        </div>
      </div>
      {(errors.length > 0 || gasError) && (
        <div
          className={`${FORM_ROW_COMPACT_CLASS} tw-pb-2 tw-pt-2 ${styles["newDelegationError"]}`}
          role="alert"
          aria-live="assertive"
        >
          <div className="tw-flex tw-items-center sm:tw-col-span-4">Errors</div>
          <div className="tw-flex tw-items-center sm:tw-col-span-8">
            <ul className="tw-mb-0">
              {errors.map((e) => (
                <li key={getRandomObjectId()}>{e}</li>
              ))}
              {gasError && <li>{gasError}</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export function DelegationExpiryCalendar(
  props: Readonly<{
    setDelegationDate: (date: Date | undefined) => void;
  }>
) {
  return (
    <div className="tw-w-full tw-p-0 tw-pt-3">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-px-3 md:tw-w-1/2 lg:tw-w-1/3">
          <DelegationFormInput
            aria-label="Expiry Date"
            min={new Date().toISOString().slice(0, 10)}
            type="date"
            placeholder="Expiry Date"
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                props.setDelegationDate(new Date(value));
              } else {
                props.setDelegationDate(undefined);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function DelegationTokenSelection(
  props: Readonly<{
    setDelegationToken: (token: number | undefined) => void;
  }>
) {
  return (
    <div className="tw-w-full tw-p-0 tw-pt-3">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-px-3 md:tw-w-1/2 lg:tw-w-1/3">
          <DelegationFormInput
            aria-label="Token ID"
            min={0}
            type="number"
            placeholder="Token ID"
            onChange={(e) => {
              const value = e.target.value;
              try {
                const intValue = parseInt(value);
                props.setDelegationToken(intValue);
              } catch {
                props.setDelegationToken(undefined);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function DelegationCloseButton(
  props: Readonly<{ title: string; onHide: () => void }>
) {
  const tooltipId = `delegation-close-button-${props.title
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <>
      <button
        type="button"
        aria-label={`Cancel ${props.title}`}
        className={styles["closeNewDelegationForm"]}
        onClick={() => props.onHide()}
        data-tooltip-id={tooltipId}
      >
        <FontAwesomeIcon icon={faTimesCircle} aria-hidden />
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        delayShow={250}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        {`Cancel ${props.title}`}
      </Tooltip>
    </>
  );
}
