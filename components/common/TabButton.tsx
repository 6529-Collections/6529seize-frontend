"use client";

import { useTransition, type ComponentProps } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

// Keep transition state and screen-reader feedback local to the button.
export default function TabButton({
  onClick,
  children,
  className,
  ...props
}: ComponentProps<"button">) {
  const [isPending, startTransition] = useTransition();
  const locale = useBrowserLocale();

  return (
    <>
      <button
        {...props}
        className={`tw-relative ${className ?? ""}`}
        aria-busy={isPending || props["aria-busy"]}
        onClick={(event) => startTransition(() => onClick?.(event))}
      >
        {children}
      </button>
      <span role="status" className="tw-sr-only">
        {isPending ? t(locale, "wave.navigation.loadingSection") : ""}
      </span>
    </>
  );
}
