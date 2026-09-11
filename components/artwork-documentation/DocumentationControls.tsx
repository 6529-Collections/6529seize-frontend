"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

export const inputClass =
  "tw-block tw-w-full tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-opacity-60";
export const panelClass =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 sm:tw-p-6";

export function useDocumentationMessages() {
  const locale = useBrowserLocale();
  return {
    locale,
    msg: (key: string, params?: Record<string, string | number>) =>
      t(locale, `artworkDocumentation.${key}` as MessageKey, params),
  };
}

export function DocumentationButton({
  children,
  secondary = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { readonly secondary?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${secondary ? "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-100 hover:tw-bg-iron-800" : "tw-border-primary-500 tw-bg-primary-500 tw-text-white hover:tw-bg-primary-600"} ${className}`}
    >
      {children}
    </button>
  );
}

export function DocumentationNotice({
  children,
  error = false,
}: {
  readonly children: ReactNode;
  readonly error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`tw-rounded-lg tw-border tw-border-solid tw-p-4 tw-text-sm tw-leading-relaxed ${error ? "tw-border-rose-800 tw-bg-rose-950/30 tw-text-rose-200" : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300"}`}
    >
      {children}
    </div>
  );
}
