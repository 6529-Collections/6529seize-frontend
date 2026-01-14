"use client";

import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import React, { useCallback, useState } from "react";
import { TraitWrapper } from "../../traits/TraitWrapper";
import type { PaymentInfo } from "../types/OperationalData";
import FormSection from "../ui/FormSection";
import { validateStrictAddress } from "../utils/addressValidation";

interface PaymentConfigProps {
  readonly paymentInfo: PaymentInfo;
  readonly onPaymentInfoChange: (paymentInfo: PaymentInfo) => void;
}

const PaymentConfig: React.FC<PaymentConfigProps> = ({
  paymentInfo,
  onPaymentInfoChange,
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
        designated_payee_name: checked
          ? (paymentInfo.designated_payee_name ?? "")
          : "",
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

  const address = paymentInfo.payment_address ?? "";
  const hasDesignatedPayee = paymentInfo.has_designated_payee ?? false;
  const designatedPayeeName = paymentInfo.designated_payee_name ?? "";
  const addressError = getAddressError(address);
  const isAddressValid = !!address && !addressError && !isLoading;

  const designatedPayeeNameError =
    hasDesignatedPayee && !designatedPayeeName.trim()
      ? "Designated payee name is required"
      : null;

  return (
    <FormSection title="Payment">
      <p className="-tw-mt-1 tw-mb-3 tw-text-sm tw-text-iron-500">
        Address to receive split of minting proceeds.
      </p>

      <div className="tw-mb-5">
        <label className="tw-flex tw-cursor-pointer tw-items-center tw-gap-3">
          <input
            type="checkbox"
            checked={hasDesignatedPayee}
            onChange={handleDesignatedPayeeToggle}
            aria-label="Designated Payee"
            className="tw-h-4 tw-w-4 tw-cursor-pointer tw-rounded tw-border-iron-700 tw-bg-iron-900 tw-text-primary-400 focus:tw-ring-primary-400 focus:tw-ring-offset-0"
          />
          <span className="tw-text-sm">
            <span className="tw-text-iron-300">Designated Payee</span>
            <span className="tw-ml-1 tw-text-iron-500">
              — proceeds will be paid to a third party
            </span>
          </span>
        </label>
      </div>

      {hasDesignatedPayee && (
        <TraitWrapper
          label="Designated Payee Name *"
          id="designated-payee-name"
          error={designatedPayeeNameError}
          isFieldFilled={!!designatedPayeeName.trim()}
          className="tw-pb-8"
        >
          <input
            type="text"
            value={designatedPayeeName}
            onChange={handleDesignatedPayeeNameChange}
            placeholder="Enter designated payee name"
            autoFocus
            className={`tw-form-input tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 focus:tw-bg-iron-900 focus:tw-text-iron-100 ${
              designatedPayeeNameError ? "tw-ring-red" : "tw-ring-iron-700"
            } focus:tw-ring-primary-400`}
          />
        </TraitWrapper>
      )}

      <TraitWrapper
        label={
          hasDesignatedPayee
            ? "Designated Payee Address *"
            : "Payment Address *"
        }
        id="payment-address"
        error={addressError}
        isFieldFilled={isAddressValid}
        className="tw-pb-0"
      >
        <EnsAddressInput
          value={address}
          placeholder="0x... or ENS"
          onAddressChange={handleAddressChange}
          onLoadingChange={setIsLoading}
          onError={setHasEnsError}
          className={`tw-form-input tw-w-full tw-truncate tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-4 tw-pr-11 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 focus:tw-bg-iron-900 focus:tw-text-iron-100 ${
            addressError ? "tw-ring-red" : "tw-ring-iron-700"
          } focus:tw-ring-primary-400`}
        />
      </TraitWrapper>
    </FormSection>
  );
};

export default React.memo(PaymentConfig);
