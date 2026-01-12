"use client";

import React, { useCallback, useState } from "react";
import FormSection from "../ui/FormSection";
import { TraitWrapper } from "../../traits/TraitWrapper";
import { validateStrictAddress } from "../utils/addressValidation";
import type { PaymentInfo } from "../types/OperationalData";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";

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

  const address = paymentInfo.payment_address;
  const error = getAddressError(address);
  const isValid = !!address && !error && !isLoading;

  return (
    <FormSection title="Payment">
      <p className="tw-mb-4 tw-text-xs tw-text-iron-500">
        Address to receive split of minting proceeds.
      </p>
      <TraitWrapper
        label="Payment Address *"
        id="payment-address"
        error={error}
        isFieldFilled={isValid}
        className="tw-pb-0"
      >
        <EnsAddressInput
          value={address}
          placeholder="0x... or ENS"
          onAddressChange={handleAddressChange}
          onLoadingChange={setIsLoading}
          onError={setHasEnsError}
          className={`tw-form-input tw-w-full tw-truncate tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-4 tw-pr-11 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 focus:tw-bg-iron-900 focus:tw-text-iron-100 ${
            error ? "tw-ring-red" : "tw-ring-iron-700"
          } focus:tw-ring-primary-400`}
        />
      </TraitWrapper>
    </FormSection>
  );
};

export default React.memo(PaymentConfig);
