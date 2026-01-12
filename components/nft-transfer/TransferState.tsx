"use client";

import type { ContractType } from "@/types/enums";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type TransferItem = {
  key: string;
  contract: string;
  contractType: ContractType;
  tokenId: number;
  title?: string | undefined;
  thumbUrl?: string | undefined;
  max?: number | undefined;
  qty?: number | undefined;
};

type TransferContextShape = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  toggle: () => void;

  selected: Map<string, TransferItem>;
  isSelected: (key: string) => boolean;
  select: (item: TransferItem) => void;
  unselect: (key: string) => void;
  toggleSelect: (item: TransferItem) => void;

  /** quantity controls */
  setQty: (key: string, qty: number) => void;
  incQty: (key: string) => void;
  decQty: (key: string) => void;

  clear: () => void;
  count: number;
  totalQty: number;
};

const TransferContext = createContext<TransferContextShape | null>(null);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function TransferProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState<Map<string, TransferItem>>(
    () => new Map()
  );

  const isSelected = useCallback(
    (key: string) => selected.has(key),
    [selected]
  );

  const select = useCallback((item: TransferItem) => {
    const max = Math.max(1, item.max ?? 1);
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(item.key, {
        ...item,
        max,
        qty: clamp(item.qty ?? 1, 1, max),
      });
      return next;
    });
  }, []);

  const unselect = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((item: TransferItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.key)) {
        next.delete(item.key);
      } else {
        const max = Math.max(1, item.max ?? 1);
        const newItem = {
          ...item,
          max,
          qty: 1,
        };
        const newMap = new Map();
        newMap.set(item.key, newItem);
        for (const [key, value] of Array.from(next.entries())) {
          newMap.set(key, value);
        }
        return newMap;
      }
      return next;
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setSelected((prev) => {
      if (!prev.has(key)) return prev;
      const it = prev.get(key)!;
      const max = Math.max(1, it.max ?? 1);
      const next = new Map(prev);
      next.set(key, { ...it, qty: clamp(qty, 1, max) });
      return next;
    });
  }, []);

  const incQty = useCallback((key: string) => {
    setSelected((prev) => {
      if (!prev.has(key)) return prev;
      const it = prev.get(key)!;
      const max = Math.max(1, it.max ?? 1);
      const qty = clamp((it.qty ?? 1) + 1, 1, max);
      const next = new Map(prev);
      next.set(key, { ...it, qty });
      return next;
    });
  }, []);

  const decQty = useCallback((key: string) => {
    setSelected((prev) => {
      if (!prev.has(key)) return prev;
      const it = prev.get(key)!;
      const max = Math.max(1, it.max ?? 1);
      const qty = clamp((it.qty ?? 1) - 1, 1, max);
      const next = new Map(prev);
      next.set(key, { ...it, qty });
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected(new Map());
  }, []);

  const toggle = useCallback(() => {
    setEnabled((v) => !v);
  }, []);

  const count = selected.size;
  const totalQty = Array.from(selected.values()).reduce(
    (sum, it) => sum + (it.qty ?? 1),
    0
  );

  const api = useMemo<TransferContextShape>(
    () => ({
      enabled,
      setEnabled,
      toggle,

      selected,
      isSelected,
      select,
      unselect,
      toggleSelect,

      setQty,
      incQty,
      decQty,

      clear,
      count,
      totalQty,
    }),
    [
      enabled,
      setEnabled,
      toggle,
      selected,
      isSelected,
      select,
      unselect,
      toggleSelect,
      setQty,
      incQty,
      decQty,
      clear,
      count,
      totalQty,
    ]
  );

  return (
    <TransferContext.Provider value={api}>{children}</TransferContext.Provider>
  );
}

export function useTransfer() {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error("useTransfer must be used within TransferProvider");
  return ctx;
}

export function buildTransferKey(args: {
  collection?: string | null | undefined;
  tokenId?: string | number | null | undefined;
  fallback?: string | undefined;
}) {
  const col = args.collection ?? "col";
  const id =
    args.tokenId !== undefined && args.tokenId !== null
      ? String(args.tokenId)
      : (args.fallback ?? "unknown");
  return `${col}:${id}`;
}
