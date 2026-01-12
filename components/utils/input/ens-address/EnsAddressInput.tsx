"use client";

import { useEnsResolution } from "@/hooks/useEnsResolution";
import { useEffect } from "react";
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
    setInputValue,
    ensNameQuery,
    ensAddressQuery,
  } = useEnsResolution({ initialValue: value, chainId });

  useEffect(() => {
    setInputValue(value);
  }, [value, setInputValue]);

  useEffect(() => {
    onAddressChange(address);
  }, [address, onAddressChange]);

  useEffect(() => {
    onValueChange?.(inputValue);
  }, [inputValue, onValueChange]);

  useEffect(() => {
    const isLoading = ensNameQuery.isLoading || ensAddressQuery.isLoading;
    onLoadingChange?.(isLoading);
  }, [ensNameQuery.isLoading, ensAddressQuery.isLoading, onLoadingChange]);

  useEffect(() => {
    if (!onError) return;

    const isEnsInput = inputValue?.toLowerCase().endsWith(".eth");
    if (isEnsInput && ensAddressQuery.isError) {
      onError(true);
    } else {
      onError(false);
    }
  }, [inputValue, ensAddressQuery.isError, onError]);

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
