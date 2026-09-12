"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useId } from "react";
import type {
  CollectTdhDailyEstimate,
  CollectTdhDailyInput,
  CollectTdhDailyStatus,
} from "./collect-tdh-daily.types";

interface Props {
  readonly input: CollectTdhDailyInput;
  readonly estimate: Pick<
    CollectTdhDailyEstimate<unknown>,
    "dailyTdh" | "purchaseEth"
  > | null;
  readonly status: CollectTdhDailyStatus;
  readonly invalid: boolean;
  readonly needsProfile: boolean;
  readonly onChange: (input: CollectTdhDailyInput) => void;
  readonly onRetry: () => void;
  readonly onConnect: () => void;
}

export default function CollectTdhDailyControls({
  input,
  estimate,
  status,
  invalid,
  needsProfile,
  onChange,
  onRetry,
  onConnect,
}: Props) {
  const locale = useBrowserLocale();
  const id = useId();
  const loading = status === "calculating";
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="tw-min-w-0 tw-space-y-4"
    >
      <div className="tw-space-y-1">
        <h2
          id={`${id}-title`}
          className="tw-m-0 tw-text-lg tw-font-medium tw-text-iron-100"
        >
          {t(locale, "collect.tdhDaily.title")}
        </h2>
        <p className="tw-m-0 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "collect.tdhDaily.description")}
        </p>
      </div>
      <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
        {(["daily_tdh", "budget"] as const).map((mode) => {
          const driving = input.mode === mode;
          const derivedValue =
            mode === "daily_tdh" ? estimate?.dailyTdh : estimate?.purchaseEth;
          const value = driving ? input.value : (derivedValue ?? "");
          const emptyPlaceholder =
            mode === "daily_tdh"
              ? "collect.tdhDaily.targetPlaceholder"
              : "collect.tdhDaily.budgetPlaceholder";
          const placeholder =
            !driving && loading
              ? "collect.tdhDaily.calculatingField"
              : emptyPlaceholder;
          const calculated = !driving && estimate !== null;
          const fieldInvalid = driving && invalid;
          return (
            <div key={mode} className="tw-min-w-0 tw-space-y-2">
              <label
                htmlFor={`${id}-${mode}`}
                className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
              >
                {t(
                  locale,
                  mode === "daily_tdh"
                    ? "collect.tdhDaily.target"
                    : "collect.tdhDaily.budget"
                )}
              </label>
              <input
                id={`${id}-${mode}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                maxLength={80}
                value={value}
                aria-invalid={fieldInvalid}
                aria-busy={!driving && loading}
                aria-describedby={[
                  `${id}-basis`,
                  fieldInvalid ? `${id}-invalid` : undefined,
                  calculated ? `${id}-${mode}-derived` : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                placeholder={t(locale, placeholder)}
                onChange={(event) =>
                  onChange({ mode, value: event.target.value })
                }
                className="tw-block tw-min-h-11 tw-w-full tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-tabular-nums tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              />
              {calculated && (
                <p
                  id={`${id}-${mode}-derived`}
                  className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
                >
                  {t(
                    locale,
                    mode === "daily_tdh"
                      ? "collect.tdhDaily.derivedTarget"
                      : "collect.tdhDaily.derivedBudget"
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p
        id={`${id}-basis`}
        className="tw-m-0 tw-max-w-2xl tw-text-xs tw-leading-5 tw-text-iron-400"
      >
        {t(locale, "collect.tdhDaily.basis")}
      </p>
      {invalid && (
        <p
          id={`${id}-invalid`}
          role="alert"
          className="tw-m-0 tw-text-sm tw-leading-6 tw-text-error"
        >
          {t(
            locale,
            input.mode === "daily_tdh"
              ? "collect.tdhDaily.invalidTarget"
              : "collect.tdhDaily.invalidBudget"
          )}
        </p>
      )}
      {needsProfile && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "collect.tdhDaily.connect")}
          </p>
          <Button variant="secondary" size="sm" onClick={onConnect}>
            {t(locale, "collect.tdhDaily.connectAction")}
          </Button>
        </div>
      )}
      <div
        role="status"
        aria-live="polite"
        className="tw-space-y-1 tw-text-sm tw-leading-6 tw-text-iron-200"
      >
        {loading && (
          <p className="tw-m-0">{t(locale, "collect.tdhDaily.calculating")}</p>
        )}
        {estimate && (
          <>
            <p className="tw-m-0">
              {t(locale, "collect.tdhDaily.achieved", {
                value: formatDecimalString(locale, estimate.dailyTdh),
              })}
            </p>
            <p className="tw-m-0">
              {t(locale, "collect.tdhDaily.purchase", {
                value: formatDecimalString(locale, estimate.purchaseEth),
              })}
            </p>
          </>
        )}
      </div>
      {status === "error" && (
        <div className="tw-space-y-2">
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "collect.tdhDaily.failed")}
          </p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t(locale, "collect.tdhDaily.retry")}
          </Button>
        </div>
      )}
    </section>
  );
}
