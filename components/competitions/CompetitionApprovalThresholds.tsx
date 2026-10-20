"use client";

import { useId, useState } from "react";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  useCompetitionConfigEditable,
  useCompetitionConfigUpdate,
} from "@/hooks/competitions/useCompetitionConfigUpdate";
import { parsePositiveWholeNumberInput } from "@/components/waves/create-wave/utils/positiveWholeNumberInput";
import { t } from "@/i18n/messages";
import { formatInteger, formatNumber } from "@/i18n/format";
import CompetitionConfigSaveActions from "./CompetitionConfigSaveActions";
import { COMPETITION_BUTTON, COMPETITION_INPUT } from "./CompetitionState";

function ThresholdForm({ onClose }: { readonly onClose: () => void }) {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const editor = useCompetitionConfigUpdate();
  const id = useId();
  const [threshold, setThreshold] = useState(
    String(competition.decisions.winning_min_threshold ?? "")
  );
  const [seconds, setSeconds] = useState(
    String(competition.decisions.winning_threshold_min_duration_ms / 1000)
  );
  const count = parsePositiveWholeNumberInput(threshold);
  const hold =
    seconds.trim() === "" || seconds.trim() === "0"
      ? 0
      : parsePositiveWholeNumberInput(seconds);
  const duration = hold === null ? null : hold * 1000;
  const starts = competition.participation.starts_at;
  const ends = competition.voting.ends_at ?? competition.participation.ends_at;
  const thresholdInvalid = count === null;
  let durationError: string | null = null;
  if (duration === null || !Number.isSafeInteger(duration))
    durationError = t(locale, "competitions.thresholdHoldInvalid");
  else if (
    starts !== null &&
    ends !== null &&
    duration > Math.max(0, ends - starts)
  )
    durationError = t(locale, "competitions.thresholdHoldWindow");
  const invalid = thresholdInvalid || durationError !== null;
  const holdDescription = durationError
    ? `${id}-help ${id}-hold-error`
    : `${id}-help`;
  return (
    <form
      className="tw-space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (invalid) return;
        void editor
          .save(JSON.stringify({ count, duration }), (config) => ({
            ...config,
            rules: {
              ...config.rules,
              winning_threshold: count,
              winning_threshold_min_duration_ms: duration,
            },
          }))
          .then((saved) => {
            if (saved) onClose();
          });
      }}
    >
      <fieldset
        disabled={editor.busy}
        className="tw-m-0 tw-space-y-3 tw-border-0 tw-p-0"
      >
        <label htmlFor={`${id}-count`} className="tw-block tw-space-y-2">
          <span>{t(locale, "competitions.rulesLabel.threshold")}</span>
          <input
            id={`${id}-count`}
            className={COMPETITION_INPUT}
            inputMode="numeric"
            pattern="[0-9]+"
            required
            aria-invalid={thresholdInvalid}
            aria-describedby={
              thresholdInvalid ? `${id}-count-error` : undefined
            }
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
          />
        </label>
        {thresholdInvalid && (
          <p
            id={`${id}-count-error`}
            role="alert"
            className="tw-m-0 tw-text-red"
          >
            {t(locale, "competitions.thresholdInvalid")}
          </p>
        )}
        <label htmlFor={`${id}-hold`} className="tw-block tw-space-y-2">
          <span>{t(locale, "competitions.thresholdHoldSeconds")}</span>
          <input
            id={`${id}-hold`}
            className={COMPETITION_INPUT}
            inputMode="numeric"
            pattern="[0-9]+"
            value={seconds}
            onChange={(event) => setSeconds(event.target.value)}
            aria-invalid={durationError !== null}
            aria-describedby={holdDescription}
          />
        </label>
        <p id={`${id}-help`} className="tw-m-0 tw-text-iron-400">
          {t(locale, "competitions.thresholdHoldHelp")}
        </p>
        {durationError && (
          <p
            id={`${id}-hold-error`}
            role="alert"
            className="tw-m-0 tw-text-red"
          >
            {durationError}
          </p>
        )}
      </fieldset>
      <CompetitionConfigSaveActions
        busy={editor.busy}
        error={editor.error}
        invalid={invalid}
        onCancel={onClose}
      />
    </form>
  );
}

export default function CompetitionApprovalThresholds() {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const editable = useCompetitionConfigEditable();
  const [editing, setEditing] = useState(false);
  if (editing && editable)
    return <ThresholdForm onClose={() => setEditing(false)} />;
  const threshold = competition.decisions.winning_min_threshold;
  const duration = competition.decisions.winning_threshold_min_duration_ms;
  return (
    <div className="tw-space-y-3">
      <dl className="tw-m-0 tw-space-y-3">
        <div className="tw-flex tw-justify-between tw-gap-4">
          <dt className="tw-text-iron-400">
            {t(locale, "competitions.rulesLabel.threshold")}
          </dt>
          <dd className="tw-m-0">
            {threshold === null
              ? t(locale, "competitions.unlimited")
              : formatInteger(locale, threshold)}
          </dd>
        </div>
        <div className="tw-flex tw-justify-between tw-gap-4">
          <dt className="tw-text-iron-400">
            {t(locale, "competitions.rulesLabel.hold")}
          </dt>
          <dd className="tw-m-0">
            {duration
              ? formatNumber(locale, duration / 1000, {
                  style: "unit",
                  unit: "second",
                  unitDisplay: "long",
                })
              : t(locale, "competitions.rulesLabel.immediate")}
          </dd>
        </div>
      </dl>
      {editable && (
        <button
          type="button"
          className={COMPETITION_BUTTON}
          onClick={() => setEditing(true)}
        >
          {t(locale, "competitions.editThresholds")}
        </button>
      )}
    </div>
  );
}
