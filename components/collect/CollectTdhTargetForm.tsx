"use client";

import Button from "@/components/utils/button/Button";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, type ReactNode } from "react";
import { COLLECT_INPUT_CLASS } from "./CollectGoalForm";
import {
  TDH_TARGET_HORIZONS,
  type CollectTdhTargetDraft,
  type CollectTdhTargetField,
} from "./collect-tdh-target.types";

export default function CollectTdhTargetForm({
  draft,
  loading,
  connected,
  invalid,
  error,
  delivery,
  onChange,
  onSubmit,
  onConnect,
}: {
  readonly draft: CollectTdhTargetDraft;
  readonly loading: boolean;
  readonly connected: boolean;
  readonly invalid?: CollectTdhTargetField | undefined;
  readonly error?: string | undefined;
  readonly delivery: ReactNode;
  readonly onChange: (draft: CollectTdhTargetDraft) => void;
  readonly onSubmit: () => void;
  readonly onConnect: () => void;
}) {
  const id = useId();
  const locale = useBrowserLocale();
  const change = (patch: Partial<CollectTdhTargetDraft>) =>
    onChange({ ...draft, ...patch });
  return (
    <form
      aria-label={t(locale, "collect.tdhTarget.title")}
      onSubmit={(event) => {
        event.preventDefault();
        if (!loading && connected) onSubmit();
      }}
      className="tw-max-w-3xl tw-space-y-5"
    >
      <div className="tw-max-w-2xl">
        <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100">
          {t(locale, "collect.tdhTarget.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "collect.tdhTarget.description")}
        </p>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-4">
        <label className="tw-block tw-w-40 tw-space-y-2 tw-text-xs tw-text-iron-300">
          <span>{t(locale, "collect.tdhTarget.target")}</span>
          <input
            id={`${id}-target`}
            inputMode="numeric"
            autoComplete="off"
            maxLength={16}
            value={draft.targetTdh}
            onChange={(event) => change({ targetTdh: event.target.value })}
            aria-invalid={invalid === "target"}
            aria-describedby={invalid === "target" ? `${id}-error` : undefined}
            className={`${COLLECT_INPUT_CLASS} tw-tabular-nums`}
          />
        </label>
        <label className="tw-block tw-w-32 tw-space-y-2 tw-text-xs tw-text-iron-300">
          <span>{t(locale, "collect.tdhTarget.timeframe")}</span>
          <select
            value={draft.horizonDays}
            onChange={(event) => {
              const horizon = TDH_TARGET_HORIZONS.find(
                (value) => String(value) === event.target.value
              );
              if (horizon !== undefined) change({ horizonDays: horizon });
            }}
            className={COLLECT_INPUT_CLASS}
          >
            {TDH_TARGET_HORIZONS.map((days) => (
              <option key={days} value={days}>
                {t(
                  locale,
                  days === 1
                    ? "collect.tdhTarget.oneDay"
                    : "collect.goal.horizonDays",
                  { days }
                )}
              </option>
            ))}
          </select>
        </label>
        <label className="tw-block tw-w-40 tw-space-y-2 tw-text-xs tw-text-iron-300">
          <span>{t(locale, "collect.tdhTarget.collection")}</span>
          <select
            value={draft.family}
            onChange={(event) => {
              const family = Object.values(ApiCollectFamily).find(
                (value) => value === event.target.value
              );
              if (family) change({ family });
            }}
            className={COLLECT_INPUT_CLASS}
          >
            {Object.values(ApiCollectFamily).map((family) => (
              <option key={family} value={family}>
                {t(locale, `collect.collection.${family}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <details className="tw-max-w-xl">
        <summary className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-py-3 tw-text-xs tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "collect.tdhTarget.advanced")}
        </summary>
        <div className="tw-space-y-4 tw-pb-2 tw-pt-1">
          <label className="tw-block tw-max-w-sm tw-space-y-2 tw-text-xs tw-text-iron-300">
            <span>{t(locale, "collect.tdhTarget.interpretation")}</span>
            <select
              value={draft.mode}
              onChange={(event) =>
                change({
                  mode:
                    event.target.value === "additional"
                      ? "additional"
                      : "total",
                })
              }
              className={COLLECT_INPUT_CLASS}
            >
              <option value="total">
                {t(locale, "collect.tdhTarget.total")}
              </option>
              <option value="additional">
                {t(locale, "collect.tdhTarget.additional")}
              </option>
            </select>
          </label>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.tdhTarget.additionalHint")}
          </p>
          <label className="tw-block tw-w-52 tw-space-y-2 tw-text-xs tw-text-iron-300">
            <span>{t(locale, "collect.tdhTarget.budget")}</span>
            <input
              inputMode="decimal"
              autoComplete="off"
              value={draft.budgetEth}
              placeholder={t(locale, "collect.tdhTarget.optionalBudget")}
              onChange={(event) => change({ budgetEth: event.target.value })}
              aria-invalid={invalid === "budget"}
              aria-describedby={
                invalid === "budget" ? `${id}-error` : `${id}-budget-hint`
              }
              className={`${COLLECT_INPUT_CLASS} tw-tabular-nums`}
            />
          </label>
          <p
            id={`${id}-budget-hint`}
            className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {t(locale, "collect.tdhTarget.budgetHint")}
          </p>
        </div>
      </details>
      {delivery}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
        >
          {error}
        </p>
      )}
      {connected ? (
        <Button variant="primary" type="submit" loading={loading}>
          {t(locale, "collect.tdhTarget.find")}
        </Button>
      ) : (
        <Button variant="primary" onClick={onConnect}>
          {t(locale, "collect.connect")}
        </Button>
      )}
      {loading && (
        <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "collect.tdhTarget.checking")}
        </p>
      )}
    </form>
  );
}
