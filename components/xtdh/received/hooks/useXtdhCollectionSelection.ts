"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const CONTRACT_PARAM = "xtdh_received_contract";

export interface XtdhCollectionSelectionResult {
  readonly selectedContract: string | null;
  readonly handleCollectionSelect: (contract: string | null | undefined) => void;
  readonly clearSelection: () => void;
}

function normalizeContract(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toLowerCase();
}

export function useXtdhCollectionSelection(): XtdhCollectionSelectionResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedContract = useMemo(
    () => normalizeContract(searchParams?.get(CONTRACT_PARAM) ?? null),
    [searchParams]
  );

  const updateQueryParams = useCallback(
    (nextContract: string | null) => {
      if (!pathname) {
        return;
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (nextContract) {
        params.set(CONTRACT_PARAM, nextContract);
      } else {
        params.delete(CONTRACT_PARAM);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleCollectionSelect = useCallback(
    (contract: string | null | undefined) => {
      const normalized = normalizeContract(contract ?? null);
      if (!normalized) {
        return;
      }
      if (normalized === selectedContract) {
        return;
      }
      updateQueryParams(normalized);
    },
    [selectedContract, updateQueryParams]
  );

  const clearSelection = useCallback(() => {
    if (!selectedContract) {
      return;
    }
    updateQueryParams(null);
  }, [selectedContract, updateQueryParams]);

  return {
    selectedContract,
    handleCollectionSelect,
    clearSelection,
  };
}
