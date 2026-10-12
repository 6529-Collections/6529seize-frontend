"use client";

import { useTransition, type ComponentProps } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

// Keep click feedback local to the button while the destination renders.
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
        {isPending && (
          <span
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-right-0 tw-top-0 tw-size-2.5 tw-rounded-full tw-border tw-border-solid tw-border-primary-300 tw-border-t-transparent motion-safe:tw-animate-spin"
          />
        )}
      </button>
      <span role="status" className="tw-sr-only">
        {isPending ? t(locale, "wave.navigation.loadingSection") : ""}
      </span>
    </>
  );
}
