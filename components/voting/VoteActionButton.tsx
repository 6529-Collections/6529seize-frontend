"use client";

import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import type { VoteControlVariant } from "./VoteControl.styles";

export function getVoteActionLabel(
  locale: SupportedLocale,
  amount: number,
  unit: string
): string {
  if (!Number.isFinite(amount)) return t(locale, "competitions.voteAction");
  return t(locale, "competitions.voteActionAmount", {
    amount: `${amount > 0 ? "+" : ""}${formatInteger(locale, amount)}`,
    unit,
  });
}

interface VoteActionButtonProps extends ComponentPropsWithoutRef<"button"> {
  readonly amount: number;
  readonly unit: string;
  readonly variant?: VoteControlVariant | undefined;
}

export function VoteActionButton({
  amount,
  unit,
  variant = "default",
  children,
  className,
  ...props
}: VoteActionButtonProps) {
  const locale = useBrowserLocale();
  const mini = variant === "compact";
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-px-3.5 tw-font-semibold tw-tabular-nums tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50 motion-reduce:tw-transition-none",
        mini
          ? "tw-min-h-8 tw-w-auto tw-py-1.5 tw-text-[13px] tw-leading-4 touch-only:after:tw-absolute touch-only:after:tw-inset-x-0 touch-only:after:tw-top-1/2 touch-only:after:tw-h-11 touch-only:after:-tw-translate-y-1/2 touch-only:after:tw-content-['']"
          : "tw-min-h-11 tw-w-full tw-py-2.5 tw-text-sm",
        amount > 0 &&
          "tw-border-emerald-400 tw-bg-emerald-500 tw-text-emerald-950 desktop-hover:hover:tw-bg-emerald-400",
        amount < 0 &&
          "tw-border-rose-500 tw-bg-rose-600 tw-text-white desktop-hover:hover:tw-bg-rose-700",
        (!Number.isFinite(amount) || amount === 0) &&
          "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800",
        className
      )}
    >
      {children ?? getVoteActionLabel(locale, amount, unit)}
    </button>
  );
}
