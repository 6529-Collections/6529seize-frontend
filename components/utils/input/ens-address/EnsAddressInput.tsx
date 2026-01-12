"use client";

import { useEnsResolution } from "@/hooks/useEnsResolution";
import { useEffect, useEffectEvent } from "react";
import { Form } from "react-bootstrap";

interface EnsAddressInputProps {
  readonly value?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly className?: string | undefined;
  readonly chainId?: number;
  readonly onAddressChange: (address: string) => void;
  readonly onValueChange?: (value: string) => void;
  readonly onLoadingChange?: (isLoading: boolean) => void;
  readonly onError?: (hasError: boolean) => void;
}

export default function EnsAddressInput({
  value = "",
  placeholder = "0x... or ENS",
  disabled = false,
  autoFocus = false,
  className,
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
    <Form.Control
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={className}
      type="text"
      value={inputValue}
      onChange={(e) => handleInputChange(e.target.value)}
    />
  );
}
