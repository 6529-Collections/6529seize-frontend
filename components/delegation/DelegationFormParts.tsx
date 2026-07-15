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

const FORM_ROW_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-2 tw-pb-4 sm:tw-grid-cols-12 sm:tw-gap-4";
const FORM_ROW_COMPACT_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-12 sm:tw-gap-4";
const INPUT_CLASS =
  "tw-block tw-min-h-11 tw-w-full tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-300 tw-bg-white tw-px-3 tw-py-2 tw-text-base tw-leading-6 tw-text-black focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-200 disabled:tw-text-iron-500";
const RADIO_CLASS =
  "tw-h-4 tw-w-4 tw-cursor-pointer tw-border-0 tw-bg-white tw-text-black focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

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

export function DelegationFormShell(
  props: Readonly<{
    title: string;
    description?: string | undefined;
    closeTitle?: string | undefined;
    showClose?: boolean | undefined;
    onHide: () => void;
    children: ReactNode;
  }>
) {
  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-4 sm:tw-p-6">
      <header className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div>
          <h2 className="tw-mb-2 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white">
            {props.title}
          </h2>
          {props.description && (
            <p className="tw-mb-0 tw-text-base tw-leading-6 tw-text-iron-300">
              {props.description}
            </p>
          )}
        </div>
        {props.showClose !== false && (
          <DelegationCloseButton
            onHide={props.onHide}
            title={props.closeTitle ?? props.title}
          />
        )}
      </header>
      <div className="tw-mt-6">{props.children}</div>
    </section>
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
    <input {...inputProps} className={`${INPUT_CLASS} ${className ?? ""}`} />
  );
}

export function DelegationFormSelect(
  props: ComponentPropsWithoutRef<"select">
) {
  const { className, children, ...selectProps } = props;
  return (
    <select {...selectProps} className={`${INPUT_CLASS} ${className ?? ""}`}>
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
      className={`tw-mr-4 tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-py-2 tw-text-base tw-text-iron-100 ${className ?? ""}`}
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
      className={`tw-flex tw-items-center tw-text-sm tw-font-semibold tw-text-iron-200 sm:tw-min-h-11 ${getLabelSpanClass(
        props.span ?? 3
      )}`}
    >
      {props.title}
      <FontAwesomeIcon
        className="tw-ml-2 tw-h-4 tw-w-4 tw-cursor-help tw-text-iron-400"
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
    isDestructive?: boolean | undefined;
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
    isDestructive = false,
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
        className="tw-font-semibold tw-text-primary-600 tw-underline tw-underline-offset-2 hover:tw-text-primary-500"
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
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3 sm:tw-col-span-8">
          {showCancel && (
            <button
              type="button"
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-px-5 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-iron-400 hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              onClick={() => onHide()}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={isLoading()}
            className={`tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-5 tw-py-2.5 tw-text-base tw-font-semibold tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 disabled:tw-cursor-not-allowed disabled:tw-border-iron-700 disabled:tw-bg-iron-700 disabled:tw-text-iron-400 ${
              isDestructive
                ? "tw-border-red tw-bg-red tw-text-white hover:tw-bg-[#e05f57] focus-visible:tw-ring-red"
                : "tw-border-white tw-bg-white tw-text-black hover:tw-bg-iron-200 focus-visible:tw-ring-primary-400"
            }`}
            onClick={(e) => {
              e.preventDefault();
              submitDelegation();
            }}
          >
            {submitBtnLabel ?? "Submit"}{" "}
            {isLoading() && (
              <span className="tw-inline-block">
                <output className="tw-border-current/30 tw-inline-block tw-h-5 tw-w-5 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-t-current">
                  <span className="tw-sr-only">Transaction pending</span>
                </output>
              </span>
            )}
          </button>
        </div>
      </div>
      {(errors.length > 0 || gasError) && (
        <div
          className={`${FORM_ROW_COMPACT_CLASS} tw-pb-2 tw-pt-2 tw-text-error`}
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
    <div className="tw-mt-3 tw-w-full sm:tw-max-w-xs">
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
  );
}

export function DelegationTokenSelection(
  props: Readonly<{
    setDelegationToken: (token: number | undefined) => void;
  }>
) {
  return (
    <div className="tw-mt-3 tw-w-full sm:tw-max-w-xs">
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
        className="tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        onClick={() => props.onHide()}
        data-tooltip-id={tooltipId}
      >
        <FontAwesomeIcon
          icon={faTimesCircle}
          className="tw-h-6 tw-w-6"
          aria-hidden
        />
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
