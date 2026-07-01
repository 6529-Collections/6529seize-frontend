"use client";

import { useCallback, useState } from "react";
import { useEnsAddress, useEnsName } from "wagmi";

const LABEL_SEPARATOR = " - ";

type UseEnsResolutionOptions = Readonly<{
  initialValue?: string | undefined;
  chainId?: number | undefined;
}>;

type EnsResolutionState = Readonly<{
  inputValue: string;
  initialValue: string;
  addressOverride: string | undefined;
}>;

export function useEnsResolution(options: UseEnsResolutionOptions = {}) {
  const { initialValue = "", chainId = 1 } = options;
  const [state, setState] = useState<EnsResolutionState>(() => ({
    inputValue: initialValue,
    initialValue,
    addressOverride: undefined,
  }));

  let currentState = state;
  if (currentState.initialValue !== initialValue) {
    const nextResolvedAddress = getResolvedAddressFromInputValue(initialValue);
    const nextInputValue = shouldPreserveResolvedDisplayValue({
      current: currentState.inputValue,
      initialValue,
      nextResolvedAddress,
    })
      ? currentState.inputValue
      : initialValue;

    currentState = {
      inputValue: nextInputValue,
      initialValue,
      addressOverride: undefined,
    };
    setState(currentState);
  }

  const inputAddress = getResolvedAddressFromInputValue(
    currentState.inputValue
  );

  const ensNameQuery = useEnsName({
    address: inputAddress.toLowerCase().startsWith("0x")
      ? (inputAddress as `0x${string}`)
      : undefined,
    chainId,
  });

  const ensAddressQuery = useEnsAddress({
    name: getEnsInputName(currentState.inputValue),
    chainId,
  });

  const resolvedAddress =
    currentState.addressOverride ?? ensAddressQuery.data ?? inputAddress;
  const inputValue = getDisplayInputValue({
    inputValue: currentState.inputValue,
    ensName: ensNameQuery.data,
    resolvedAddressFromEns: ensAddressQuery.data,
  });

  const setInputValue = useCallback(
    (value: string) => {
      setState((current) => ({
        inputValue: value,
        initialValue: current.initialValue,
        addressOverride: undefined,
      }));
    },
    [setState]
  );

  const handleInputChange = setInputValue;

  const setAddress = useCallback(
    (value: string) => {
      setState((current) => ({
        ...current,
        addressOverride: getResolvedAddressFromInputValue(value),
      }));
    },
    [setState]
  );

  return {
    inputValue,
    address: resolvedAddress,
    setInputValue,
    setAddress,
    handleInputChange,
    ensNameQuery,
    ensAddressQuery,
  };
}

function getEnsInputName(value: string): string | undefined {
  if (value.includes(LABEL_SEPARATOR)) {
    return undefined;
  }

  return value.toLowerCase().endsWith(".eth") ? value : undefined;
}

function getDisplayInputValue({
  inputValue,
  ensName,
  resolvedAddressFromEns,
}: {
  inputValue: string;
  ensName: string | null | undefined;
  resolvedAddressFromEns: string | null | undefined;
}): string {
  if (!inputValue) {
    return inputValue;
  }

  if (
    resolvedAddressFromEns !== null &&
    resolvedAddressFromEns !== undefined &&
    resolvedAddressFromEns !== ""
  ) {
    return normalizeInputWithResolvedAddress(
      inputValue,
      resolvedAddressFromEns
    );
  }

  if (inputValue.includes(LABEL_SEPARATOR)) {
    return inputValue;
  }

  if (
    ensName !== null &&
    ensName !== undefined &&
    ensName !== "" &&
    inputValue.toLowerCase().startsWith("0x")
  ) {
    return `${ensName}${LABEL_SEPARATOR}${inputValue}`;
  }

  return inputValue;
}

function getResolvedAddressFromInputValue(value: string): string {
  const parts = value.split(LABEL_SEPARATOR);
  if (parts.length < 2) {
    return value;
  }

  const trailingValue = parts[parts.length - 1]?.trim();
  if (trailingValue?.toLowerCase().startsWith("0x")) {
    return trailingValue;
  }

  return value;
}

function shouldPreserveResolvedDisplayValue({
  current,
  initialValue,
  nextResolvedAddress,
}: {
  current: string;
  initialValue: string;
  nextResolvedAddress: string;
}): boolean {
  if (!current.includes(LABEL_SEPARATOR)) {
    return false;
  }

  if (!initialValue.toLowerCase().startsWith("0x")) {
    return false;
  }

  const currentResolvedAddress = getResolvedAddressFromInputValue(current);
  return (
    currentResolvedAddress.toLowerCase() === nextResolvedAddress.toLowerCase()
  );
}

function normalizeInputWithResolvedAddress(
  current: string,
  resolvedAddress: string
): string {
  if (!current) {
    return resolvedAddress;
  }

  if (current.endsWith(`${LABEL_SEPARATOR}${resolvedAddress}`)) {
    return current;
  }

  const parts = current.split(LABEL_SEPARATOR);

  if (parts.length === 1) {
    return `${current}${LABEL_SEPARATOR}${resolvedAddress}`;
  }

  const lastIndex = parts.length - 1;
  if (parts[lastIndex]?.toLowerCase().startsWith("0x")) {
    parts[lastIndex] = resolvedAddress;
    return parts.join(LABEL_SEPARATOR);
  }

  return `${current}${LABEL_SEPARATOR}${resolvedAddress}`;
}
