"use client";

import { useEnsResolution } from "@/hooks/useEnsResolution";
import { useEffect, useEffectEvent } from "react";
import clsx from "clsx";

interface EnsAddressInputProps {
  readonly id?: string | undefined;
  readonly value?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly className?: string | undefined;
  readonly variant?: "default" | "dark" | undefined;
  readonly ariaDescribedBy?: string | undefined;
  readonly chainId?: number;
  readonly onAddressChange: (address: string) => void;
  readonly onValueChange?: (value: string) => void;
  readonly onLoadingChange?: (isLoading: boolean) => void;
  readonly onError?: (hasError: boolean) => void;
}

const defaultInputClassName =
  "tw-block tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-300 tw-bg-white tw-bg-clip-padding tw-px-3 tw-py-1.5 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-950 tw-transition-[border-color,box-shadow] placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-bg-white focus:tw-text-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/30 disabled:tw-bg-iron-100 disabled:tw-opacity-100";

const darkInputClassName =
  "tw-block tw-h-11 tw-w-full tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/25 tw-bg-clip-padding tw-px-4 tw-py-2.5 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-100 tw-shadow-none tw-transition-[border-color,background-color,box-shadow] placeholder:tw-text-iron-600 focus:tw-border-primary-400/70 focus:tw-bg-black/30 focus:tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/20 disabled:tw-bg-black/20 disabled:tw-text-iron-500 disabled:tw-opacity-100";

export default function EnsAddressInput({
  id,
  value = "",
  placeholder = "0x... or ENS",
  disabled = false,
  autoFocus = false,
  className,
  variant = "default",
  ariaDescribedBy,
  chainId = 1,
  onAddressChange,
  onValueChange,
  onLoadingChange,
  onError,
}: EnsAddressInputProps) {
  const {
    inputValue,
    address,
    handleInputChange,
    ensNameQuery,
    ensAddressQuery,
  } = useEnsResolution({ initialValue: value, chainId });

  const onAddressChangeEvent = useEffectEvent((addr: string) => {
    onAddressChange(addr);
  });

  const onValueChangeEvent = useEffectEvent((val: string) => {
    onValueChange?.(val);
  });

  const onLoadingChangeEvent = useEffectEvent((isLoading: boolean) => {
    onLoadingChange?.(isLoading);
  });

  const onErrorEvent = useEffectEvent((hasError: boolean) => {
    onError?.(hasError);
  });

  useEffect(() => {
    onAddressChangeEvent(address);
  }, [address]);

  useEffect(() => {
    onValueChangeEvent(inputValue);
  }, [inputValue]);

  useEffect(() => {
    const isLoading = ensNameQuery.isLoading || ensAddressQuery.isLoading;
    onLoadingChangeEvent(isLoading);
  }, [ensNameQuery.isLoading, ensAddressQuery.isLoading]);

  useEffect(() => {
    const isEnsInput = inputValue?.toLowerCase().endsWith(".eth");
    if (isEnsInput && ensAddressQuery.isError) {
      onErrorEvent(true);
    } else {
      onErrorEvent(false);
    }
  }, [inputValue, ensAddressQuery.isError]);

  return (
    <input
      id={id}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder={placeholder}
      aria-describedby={ariaDescribedBy}
      className={clsx(
        variant === "dark" ? darkInputClassName : defaultInputClassName,
        className
      )}
      type="text"
      value={inputValue}
      onChange={(e) => handleInputChange(e.target.value)}
    />
  );
}
