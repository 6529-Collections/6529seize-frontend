"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";

type RatingInputProps = Omit<ComponentProps<"input">, "value" | "type"> & {
  readonly value: string;
  readonly selectOnFocus?: boolean;
};

/** Group idle amounts without changing the raw draft or caret while editing. */
export default function RatingInput({
  value,
  onFocus,
  onBlur,
  selectOnFocus = false,
  ...props
}: RatingInputProps) {
  const locale = useBrowserLocale();
  const [focused, setFocused] = useState(false);
  const focusedInput = useRef<HTMLInputElement | null>(null);
  useLayoutEffect(() => {
    if (focused && selectOnFocus) focusedInput.current?.select();
  }, [focused, selectOnFocus]);
  const amount = Number(value);
  const canFormat = /^-?\d+$/.test(value) && Number.isSafeInteger(amount);
  return (
    <input
      {...props}
      type="text"
      value={!focused && canFormat ? formatInteger(locale, amount) : value}
      onFocus={(event) => {
        focusedInput.current = event.currentTarget;
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
    />
  );
}
