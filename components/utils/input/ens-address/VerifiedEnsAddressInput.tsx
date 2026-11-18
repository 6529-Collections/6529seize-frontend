"use client";

import { type ComponentProps, useId, useState } from "react";
import { getAddress, isAddress } from "viem";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

type VerifiedEnsAddressInputProps = Omit<
  ComponentProps<typeof EnsAddressInput>,
  "requireEnsResolution"
>;

/**
 * An address input for payouts and distributions. An ENS name is resolved
 * forward, a pasted "label - 0x..." never vouches for its address, and the
 * address that will be used is always shown in full (checksummed).
 */
export default function VerifiedEnsAddressInput(
  props: Readonly<VerifiedEnsAddressInputProps>
) {
  const {
    ariaDescribedBy,
    onAddressChange,
    onValueChange,
    onLoadingChange,
    onError,
  } = props;
  const locale = useBrowserLocale();
  const noteId = useId();
  const [inputValue, setInputValue] = useState(props.value ?? "");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  let note: string | null = null;
  if (!isLoading && isAddress(address, { strict: false })) {
    note = t(locale, "ensAddressInput.addressUsed", {
      address: getAddress(address),
    });
  } else if (!isLoading && !hasError && !address && inputValue.trim()) {
    note = t(locale, "ensAddressInput.noAddressUsed");
  }

  return (
    <>
      <EnsAddressInput
        {...props}
        requireEnsResolution
        ariaDescribedBy={
          note === null
            ? ariaDescribedBy
            : [ariaDescribedBy, noteId].filter(Boolean).join(" ")
        }
        onAddressChange={(next) => {
          setAddress(next);
          onAddressChange(next);
        }}
        onValueChange={(next) => {
          setInputValue(next);
          onValueChange?.(next);
        }}
        onLoadingChange={(next) => {
          setIsLoading(next);
          onLoadingChange?.(next);
        }}
        onError={(next) => {
          setHasError(next);
          onError?.(next);
        }}
      />
      {note === null ? null : (
        <p
          id={noteId}
          className="tw-mb-0 tw-mt-1.5 tw-break-all tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {note}
        </p>
      )}
    </>
  );
}
