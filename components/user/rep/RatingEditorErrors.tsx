"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export default function RatingEditorErrors({
  formId,
  matter,
  validNumbers,
  withinAllowance,
  changed,
  available,
  error,
  prepareError,
}: {
  readonly formId: string;
  readonly matter: "REP" | "NIC";
  readonly validNumbers: boolean;
  readonly withinAllowance: boolean;
  readonly changed: boolean;
  readonly available: number;
  readonly error: string | null;
  readonly prepareError: boolean;
}) {
  const locale = useBrowserLocale();
  const overLimit = validNumbers && changed && !withinAllowance;
  const saveError = error !== null || prepareError;
  const updateError = t(
    locale,
    matter === "REP"
      ? "rep.categories.edit.updateError"
      : "user.rate.updateError"
  );
  if (validNumbers && !overLimit && !saveError) return null;
  return (
    <div className="tw-mt-1 tw-text-xs tw-text-rose-400">
      {!validNumbers && (
        <p id={`${formId}-invalid-number`} role="alert" className="tw-m-0">
          {t(locale, "rep.categories.panel.invalidNumber")}
        </p>
      )}
      {overLimit && (
        <p id={`${formId}-credit-limit`} role="alert" className="tw-m-0">
          {matter === "REP"
            ? t(locale, "rep.categories.panel.creditLimit", {
                amount: formatInteger(locale, available),
              })
            : t(locale, "user.rate.creditLimit", {
                matter,
                amount: formatInteger(locale, available),
              })}
        </p>
      )}
      {saveError && (
        <p role="alert" className="tw-m-0">
          {error ?? updateError}{" "}
          {t(locale, "rep.categories.panel.saveRecovery")}
        </p>
      )}
    </div>
  );
}
