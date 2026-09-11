"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { useId, useState } from "react";
import { validateCollectGoal } from "./collect-form.validation";
import CollectGoalDefinitionPicker from "./CollectGoalDefinitionPicker";
import CollectCompletionControls, {
  type CollectCompletionSelection,
} from "./CollectCompletionControls";
import type {
  CollectGoalDraft,
  CollectGoalOption,
  CollectIntent,
  CollectProfileView,
} from "./collect.types";

export const COLLECT_INPUT_CLASS =
  "tw-block tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 placeholder:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

interface CollectGoalFormProps {
  readonly draft: CollectGoalDraft;
  readonly definitions: readonly CollectGoalOption[];
  readonly profile: CollectProfileView | null;
  readonly loading: boolean;
  readonly error?: string | undefined;
  readonly onChange: (draft: CollectGoalDraft) => void;
  readonly onSubmit: (draft: CollectGoalDraft) => void;
  readonly onConnect: () => void;
  readonly showBudget?: boolean;
  readonly budgetOptional?: boolean;
  readonly completion?: CollectCompletionSelection;
}

export default function CollectGoalForm(props: CollectGoalFormProps) {
  const locale = useBrowserLocale();
  const id = useId();
  const [invalidField, setInvalidField] =
    useState<ReturnType<typeof validateCollectGoal>>(null);
  const { draft } = props;
  const showQuantity = ["season", "full_set", "artist"].includes(draft.intent);
  const needsDefinition = draft.intent !== "tdh";
  const showDefinition =
    needsDefinition && !(props.completion && draft.intent === "full_set");
  const definitionLabels: Partial<Record<CollectIntent, MessageKey>> = {
    season: "collect.goal.season",
    artist: "collect.goal.artist",
    pebbles_set: "collect.goal.set",
  };
  const definitionPlaceholders: Partial<Record<CollectIntent, MessageKey>> = {
    season: "collect.goal.selectSeason",
    artist: "collect.goal.selectArtist",
    pebbles_set: "collect.goal.selectSet",
  };
  let gridClass = "sm:tw-grid-cols-2 lg:tw-grid-cols-3";
  if (showQuantity) {
    gridClass = showDefinition
      ? "sm:tw-grid-cols-[minmax(0,1fr)_7rem] lg:tw-grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)]"
      : "sm:tw-grid-cols-[7rem_minmax(0,20rem)]";
  }
  const errors = {
    definition: "collect.goal.requiredDefinition",
    quantity: "collect.goal.invalidCount",
    budget: "collect.goal.invalidBudget",
  } as const;
  const validationMessage = invalidField
    ? t(locale, errors[invalidField])
    : null;
  const change = (patch: Partial<CollectGoalDraft>) => {
    setInvalidField(null);
    props.onChange({ ...draft, ...patch });
  };
  return (
    <form
      aria-label={t(locale, `collect.intent.${draft.intent}`)}
      onSubmit={(event) => {
        event.preventDefault();
        const invalid = validateCollectGoal(
          draft,
          props.showBudget !== false && !props.budgetOptional
        );
        setInvalidField(invalid);
        if (!invalid && props.profile && !props.loading) props.onSubmit(draft);
      }}
      className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/40 tw-p-4 sm:tw-p-5"
    >
      {props.completion ? (
        <CollectCompletionControls
          {...props.completion}
          intent={draft.intent}
          locale={locale}
          disabled={props.loading}
        />
      ) : (
        <h2 className="tw-mb-4 tw-mt-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, `collect.intent.${draft.intent}`)}
        </h2>
      )}
      <div className={`tw-grid tw-gap-4 ${gridClass}`}>
        {showDefinition && (
          <CollectGoalDefinitionPicker
            key={draft.intent}
            label={t(
              locale,
              definitionLabels[draft.intent] ?? "collect.goal.definition"
            )}
            placeholder={t(
              locale,
              definitionPlaceholders[draft.intent] ??
                "collect.goal.selectDefinition"
            )}
            locale={locale}
            value={draft.definitionId}
            definitions={props.definitions}
            disabled={props.loading}
            invalid={invalidField === "definition"}
            {...(invalidField === "definition"
              ? { errorId: `${id}-error` }
              : {})}
            onChange={(definitionId) => change({ definitionId })}
          />
        )}
        {showQuantity && (
          <label className="tw-max-w-28 tw-space-y-2 tw-text-xs tw-font-semibold tw-text-iron-300">
            <span>{t(locale, "collect.goal.targetCount")}</span>
            <input
              disabled={props.loading}
              inputMode="numeric"
              autoComplete="off"
              value={draft.targetCount}
              maxLength={3}
              onChange={(event) => change({ targetCount: event.target.value })}
              aria-invalid={invalidField === "quantity"}
              aria-describedby={
                invalidField === "quantity" ? `${id}-error` : undefined
              }
              className={COLLECT_INPUT_CLASS}
            />
          </label>
        )}
        {props.showBudget !== false && (
          <label className="tw-space-y-2 tw-text-xs tw-font-semibold tw-text-iron-300">
            <span>
              {t(
                locale,
                props.budgetOptional
                  ? "collect.goal.optionalBudget"
                  : "collect.goal.budget"
              )}
            </span>
            <input
              disabled={props.loading}
              inputMode="decimal"
              autoComplete="off"
              maxLength={40}
              value={draft.budgetEth}
              onChange={(event) => change({ budgetEth: event.target.value })}
              aria-invalid={invalidField === "budget"}
              aria-describedby={
                invalidField === "budget" ? `${id}-error` : `${id}-budget-hint`
              }
              className={COLLECT_INPUT_CLASS}
            />
          </label>
        )}
        {draft.intent === "tdh" && (
          <label className="tw-space-y-2 tw-text-xs tw-font-semibold tw-text-iron-300">
            <span>{t(locale, "collect.goal.horizon")}</span>
            <select
              disabled={props.loading}
              value={draft.horizonDays}
              onChange={(event) => change({ horizonDays: event.target.value })}
              className={COLLECT_INPUT_CLASS}
            >
              {[1, 30, 90, 365].map((days) => (
                <option key={days} value={days}>
                  {t(locale, "collect.goal.horizonDays", { days })}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {props.showBudget !== false && (
        <p
          id={`${id}-budget-hint`}
          className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {t(
            locale,
            props.budgetOptional
              ? "collect.goal.optionalBudgetHint"
              : "collect.goal.budgetHint"
          )}
        </p>
      )}
      {draft.intent === "artist" && (
        <label className="tw-mt-4 tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
          <input
            type="checkbox"
            disabled={props.loading}
            checked={draft.includeCollaborations}
            onChange={(event) =>
              change({ includeCollaborations: event.target.checked })
            }
            className="tw-size-4 tw-accent-primary-500"
          />
          {t(locale, "collect.goal.collaborations")}
        </label>
      )}
      {draft.intent === "tdh" && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.goal.tdhNote")}
        </p>
      )}
      {draft.intent === "pebbles_set" && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.goal.pebblesNote")}
        </p>
      )}
      {needsDefinition && props.definitions.length === 0 && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300">
          {t(locale, "collect.goal.noDefinitions")}
        </p>
      )}
      {(validationMessage ?? props.error) && (
        <p
          id={`${id}-error`}
          role="alert"
          className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-5 tw-text-red"
        >
          {validationMessage ?? props.error}
        </p>
      )}
      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {props.profile
            ? t(locale, "collect.profileScope", {
                profile: props.profile.displayName,
              })
            : t(locale, "collect.goal.connect")}
        </p>
        {props.profile ? (
          <Button
            type="submit"
            variant="action"
            size="lg"
            loading={props.loading}
            disabled={needsDefinition && props.definitions.length === 0}
          >
            {t(locale, "collect.goal.preview")}
          </Button>
        ) : (
          <Button variant="secondary" size="lg" onClick={props.onConnect}>
            {t(locale, "collect.connect")}
          </Button>
        )}
      </div>
    </form>
  );
}
