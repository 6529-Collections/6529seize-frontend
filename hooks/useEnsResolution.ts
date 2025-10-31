"use client";

import { useCallback, useEffect, useState } from "react";
import { useEnsAddress, useEnsName } from "wagmi";

const LABEL_SEPARATOR = " - ";

type UseEnsResolutionOptions = Readonly<{
  initialValue?: string;
  chainId?: number;
}>;

export function useEnsResolution(
  options: UseEnsResolutionOptions = {}
) {
  const { initialValue = "", chainId = 1 } = options;
  const [inputValue, setInputValue] = useState(initialValue);
  const [resolvedAddress, setResolvedAddress] = useState(initialValue);

  useEffect(() => {
    setInputValue(initialValue);
    setResolvedAddress(initialValue);
  }, [initialValue]);

  const ensNameQuery = useEnsName({
    address:
      inputValue?.startsWith("0x")
        ? (inputValue as `0x${string}`)
        : undefined,
    chainId,
  });

  const ensAddressQuery = useEnsAddress({
    name:
      inputValue?.endsWith(".eth")
        ? inputValue
        : undefined,
    chainId,
  });

  useEffect(() => {
    const ensName = ensNameQuery.data;
    if (!ensName) {
      return;
    }

    let pendingAddress: string | null = null;

    setInputValue((current) => {
      if (!current || current.includes(LABEL_SEPARATOR)) {
        return current;
      }

      if (!current.startsWith("0x")) {
        return current;
      }

      pendingAddress = current;
      return `${ensName}${LABEL_SEPARATOR}${current}`;
    });

    if (pendingAddress) {
      setResolvedAddress(pendingAddress);
    }
  }, [ensNameQuery.data]);

  useEffect(() => {
    const resolvedAddressFromEns = ensAddressQuery.data;
    if (!resolvedAddressFromEns) {
      return;
    }

    setResolvedAddress(resolvedAddressFromEns);
    setInputValue((current) =>
      normalizeInputWithResolvedAddress(current, resolvedAddressFromEns)
    );
  }, [ensAddressQuery.data]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setResolvedAddress(value);
  }, []);

  const setAddress = useCallback((value: string) => {
    setResolvedAddress(value);
  }, []);

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
  if (parts[lastIndex]?.toLowerCase()?.startsWith("0x")) {
    parts[lastIndex] = resolvedAddress;
    return parts.join(LABEL_SEPARATOR);
  }

  return `${current}${LABEL_SEPARATOR}${resolvedAddress}`;
}
