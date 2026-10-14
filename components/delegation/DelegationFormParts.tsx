"use client";

import Button from "@/components/utils/button/Button";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useEnsResolution } from "@/hooks/useEnsResolution";
import { t } from "@/i18n/messages";
import { faInfoCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useEffect,
  useEffectEvent,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { DelegationCollection } from "./delegation-constants";
import { SUPPORTED_COLLECTIONS } from "./delegation-constants";
import {
  formatDelegationExpiryPreview,
  getMinDelegationExpiryDate,
  getViewerTimeZone,
  getZonedDateEndEpochSeconds,
  type DelegationExpirySelection,
} from "./delegation-expiry";
import type {
  DelegationWriteParams,
  DelegationWriteSettledHandler,
} from "./delegation-shared";
import { useOrignalDelegatorEnsResolution } from "./delegation-shared";
import type { DelegationToastState } from "./DelegationToast";
import {
  DELEGATION_CARD_CLASS_NAME,
  DELEGATION_FIELD_CLASS_NAME,
  DELEGATION_FIELD_LABEL_CLASS_NAME,
} from "./delegation-ui";

const FORM_ROW_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-2 tw-pb-4 sm:tw-grid-cols-12 sm:tw-gap-4";
const FORM_ROW_COMPACT_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-12 sm:tw-gap-4";
const RADIO_CLASS =
  "tw-h-4 tw-w-4 tw-cursor-pointer tw-border tw-border-solid tw-border-white/20 tw-bg-black/30 tw-text-primary-400 focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

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
    <section className={`${DELEGATION_CARD_CLASS_NAME} tw-p-4 sm:tw-p-6`}>
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
    <input
      {...inputProps}
      className={`${DELEGATION_FIELD_CLASS_NAME} ${className ?? ""}`}
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
      className={`${DELEGATION_FIELD_CLASS_NAME} ${className ?? ""}`}
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
  return (
    <div
      className={`tw-flex tw-items-center sm:tw-min-h-11 ${DELEGATION_FIELD_LABEL_CLASS_NAME} ${getLabelSpanClass(
        props.span ?? 3
      )}`}
    >
      <span>{props.title}</span>
      <TooltipIconButton
        className="tw-ml-1 tw-text-iron-400 hover:tw-bg-white/[0.05] hover:tw-text-iron-200"
        icon={faInfoCircle}
        iconClassName="tw-size-3.5 tw-text-current"
        tooltipText={props.tooltip}
      />
    </div>
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
    onWriteSettled?: DelegationWriteSettledHandler | undefined;
    isDestructive?: boolean | undefined;
    /** Receives the submit time, so time-based checks use the click, not render. */
    validate: (submittedAtMs: number) => string[];
    onHide: () => void;
    onSetToast: (toast: DelegationToastState) => void;
    submitBtnLabel?: string | undefined;
  }>
) {
  const {
    title,
    writeParams,
    showCancel,
    gasError,
    onWriteSettled,
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
  const emitToast = useEffectEvent((toast: DelegationToastState) => {
    onSetToast(toast);
  });

  function submitDelegation() {
    const newErrors = validate(Date.now());
    setErrors(newErrors);
    if (newErrors.length > 0) {
      window.scrollBy(0, 100);
    } else {
      const { functionName } = writeParams;
      if (!functionName) {
        // Unreachable: submit-time validate() runs every check the form
        // components use to decide whether functionName is set.
        return;
      }
      const contractParams = { ...writeParams, functionName };
      if (onWriteSettled) {
        writeDelegation.writeContract(contractParams, {
          onSettled: onWriteSettled,
        });
      } else {
        writeDelegation.writeContract(contractParams);
      }
      onSetToast({
        status: "confirm_wallet",
        title,
      });
    }
  }

  useEffect(() => {
    if (writeDelegation.error) {
      emitToast({
        status: "error",
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
          status: "submitted",
          title,
          transactionHash: writeDelegation.data,
        });
      } else if (waitWriteDelegation.isSuccess) {
        emitToast({
          status: "success",
          title,
          transactionHash: writeDelegation.data,
        });
      } else if (waitWriteDelegation.isError) {
        emitToast({
          status: "error",
          title: `${title} Failed`,
          message: getTransactionErrorToastMessage(
            waitWriteDelegation.error,
            "Transaction failed while waiting for confirmation."
          ),
          transactionHash: writeDelegation.data,
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
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => onHide()}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            loading={isLoading()}
            variant={isDestructive ? "destructive" : "primary"}
            size="lg"
            onClick={(e) => {
              e.preventDefault();
              submitDelegation();
            }}
          >
            {submitBtnLabel ?? "Submit"}
          </Button>
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

/**
 * Calendar date in the viewer's own time zone. The delegation expires at the
 * end of that local day; the exact instant is previewed before signing.
 */
export function DelegationExpiryCalendar(
  props: Readonly<{
    value: DelegationExpirySelection;
    onChange: (value: DelegationExpirySelection) => void;
  }>
) {
  const { value, onChange } = props;
  const locale = useBrowserLocale();
  const id = useId();
  // Fixed for the life of the field so the input, preview and submitted
  // value all use one zone and one minimum date.
  const [{ timeZone, minDate }] = useState(() => {
    const viewerTimeZone = getViewerTimeZone();
    return {
      timeZone: viewerTimeZone,
      minDate: getMinDelegationExpiryDate(Date.now(), viewerTimeZone),
    };
  });
  const zoneId = `${id}-zone`;
  const previewId = `${id}-preview`;

  return (
    <div className="tw-mt-3 tw-w-full">
      <DelegationFormInput
        aria-label={t(locale, "delegation.expiry.inputLabel")}
        aria-describedby={`${zoneId} ${previewId}`}
        className="[color-scheme:dark] sm:tw-max-w-xs"
        min={minDate}
        type="date"
        value={value.date}
        onChange={(e) => {
          const date = e.target.value;
          onChange({
            date,
            expiresAt: getZonedDateEndEpochSeconds(date, timeZone),
          });
        }}
      />
      <p
        id={zoneId}
        className="tw-mb-0 tw-mt-2 tw-break-words tw-text-sm tw-leading-5 tw-text-iron-400"
      >
        {t(locale, "delegation.expiry.timeZone", { zone: timeZone })}
      </p>
      <p
        id={previewId}
        aria-live="polite"
        className="tw-mb-0 tw-mt-1 tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100"
      >
        {value.expiresAt === null
          ? t(locale, "delegation.expiry.previewEmpty")
          : formatDelegationExpiryPreview(locale, value.expiresAt, timeZone)}
      </p>
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

function DelegationCloseButton(
  props: Readonly<{ title: string; onHide: () => void }>
) {
  return (
    <CustomTooltip content={`Cancel ${props.title}`}>
      <button
        type="button"
        aria-label={`Cancel ${props.title}`}
        className="tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.05] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        onClick={props.onHide}
      >
        <FontAwesomeIcon
          icon={faTimesCircle}
          className="tw-size-5 tw-text-current"
          aria-hidden="true"
        />
      </button>
    </CustomTooltip>
  );
}
