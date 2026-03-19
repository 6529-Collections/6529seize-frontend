"use client";

import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import React, { useCallback, useState } from "react";
import { TraitWrapper } from "../../traits/TraitWrapper";
import type { PaymentInfo } from "../types/OperationalData";
import FormSection from "../ui/FormSection";
import MetadataLengthHint from "../ui/MetadataLengthHint";
import { validateStrictAddress } from "../utils/addressValidation";
import type { MetadataValueLengthStatus } from "../utils/submissionMetadata";

interface PaymentConfigProps {
  readonly paymentInfo: PaymentInfo;
  readonly onPaymentInfoChange: (paymentInfo: PaymentInfo) => void;
  readonly paymentInfoLengthStatus?: MetadataValueLengthStatus | undefined;
}

const PaymentConfig: React.FC<PaymentConfigProps> = ({
  paymentInfo,
  onPaymentInfoChange,
  paymentInfoLengthStatus,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasEnsError, setHasEnsError] = useState(false);

  const getAddressError = (address: string): string | null => {
    if (hasEnsError) return "Could not resolve ENS name";
    if (!address) return null;
    return validateStrictAddress(address)
      ? null
      : "Invalid address (0x... 42 chars)";
  };

  const handleAddressChange = useCallback(
    (resolvedAddress: string) => {
      onPaymentInfoChange({ ...paymentInfo, payment_address: resolvedAddress });
    },
    [paymentInfo, onPaymentInfoChange]
  );

  const handleDesignatedPayeeToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      onPaymentInfoChange({
        ...paymentInfo,
        has_designated_payee: checked,
        designated_payee_name: checked ? paymentInfo.designated_payee_name : "",
      });
    },
    [paymentInfo, onPaymentInfoChange]
  );

  const handleDesignatedPayeeNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPaymentInfoChange({
        ...paymentInfo,
        designated_payee_name: e.target.value,
      });
    },
    [paymentInfo, onPaymentInfoChange]
  );

  const address = paymentInfo.payment_address;
  const hasDesignatedPayee = paymentInfo.has_designated_payee;
  const designatedPayeeName = paymentInfo.designated_payee_name;
  const addressError = getAddressError(address);
  const isAddressValid = !!address && !addressError && !isLoading;

  const designatedPayeeNameError =
    hasDesignatedPayee && !designatedPayeeName.trim()
      ? "Designated payee name is required"
      : null;

  return (
    <FormSection title="Payment" contentClassName="-tw-mt-3">
      <p className="tw-mb-5 tw-text-[13px] tw-text-iron-400">
        Address to receive split of minting proceeds.
      </p>
      <MetadataLengthHint
        status={paymentInfoLengthStatus}
        className="tw-mb-4"
      />

      <div className="tw-mb-5">
        <label className="tw-group tw-flex tw-w-max tw-cursor-pointer tw-items-center tw-gap-3">
          <input
            type="checkbox"
            checked={hasDesignatedPayee}
            onChange={handleDesignatedPayeeToggle}
            aria-label="Designated Payee"
            className="tw-form-checkbox tw-h-4 tw-w-4 tw-cursor-pointer tw-rounded tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 focus:tw-ring-offset-0 desktop-hover:group-hover:tw-border-iron-400"
          />
          <span className="tw-text-[13px] tw-text-iron-400">
            <span className="tw-font-medium tw-text-iron-200 tw-transition-colors desktop-hover:group-hover:tw-text-white">
              Designated Payee
            </span>
            <span className="tw-ml-1 tw-text-iron-400">
              — proceeds will be paid to a third party
            </span>
          </span>
        </label>
      </div>

      {hasDesignatedPayee && (
        <TraitWrapper
          label="Designated Payee Name"
          id="designated-payee-name"
          error={designatedPayeeNameError}
          isFieldFilled={!!designatedPayeeName.trim()}
          showRequiredMarker={true}
          className="tw-pb-8"
        >
          <input
            type="text"
            value={designatedPayeeName}
            onChange={handleDesignatedPayeeNameChange}
            placeholder="Enter designated payee name"
            autoFocus
            className={`tw-form-input tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-base tw-text-iron-100 tw-outline-none tw-ring-1 focus:tw-bg-iron-900 focus:tw-text-iron-100 sm:tw-text-sm ${
              designatedPayeeNameError ? "tw-ring-red" : "tw-ring-iron-700"
            } focus:tw-ring-primary-400`}
          />
        </TraitWrapper>
      )}

      <TraitWrapper
        label={
          hasDesignatedPayee ? "Designated Payee Address" : "Payment Address"
        }
        id="payment-address"
        error={addressError}
        isFieldFilled={isAddressValid}
        showRequiredMarker={true}
        labelTone="muted"
        className="tw-pb-0"
      >
        <EnsAddressInput
          value={address}
          placeholder="0x... or ENS"
          onAddressChange={handleAddressChange}
          onLoadingChange={setIsLoading}
          onError={setHasEnsError}
          className={`tw-form-input tw-w-full tw-truncate tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-4 tw-pr-11 tw-text-base tw-text-iron-100 tw-outline-none tw-ring-1 focus:tw-bg-iron-900 focus:tw-text-iron-100 sm:tw-text-sm ${
            addressError ? "tw-ring-red" : "tw-ring-iron-700"
          } focus:tw-ring-primary-400`}
        />
      </TraitWrapper>
    </FormSection>
  );
};

export default React.memo(PaymentConfig);
