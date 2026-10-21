"use client";

import { useId, useState, type FormEvent } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ApiModerationCheckReviewStatusEnum } from "@/generated/models/ApiModerationCheck";
import {
  CHECK_FILTER_OPTIONS,
  checkValueLabel,
  checkControlClass,
  checkButtonClass,
  readCheckFilters,
} from "./checks.helpers";
import {
  checkFilterFormParams,
  clearFilterDateError,
  readCheckFilterForm,
} from "./check-filter-form";

export default function CheckFilters({
  params,
  onApply,
}: {
  readonly params: URLSearchParams;
  readonly onApply: (params: URLSearchParams) => void;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const filters = readCheckFilters(params);
  const [expanded, setExpanded] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const appliedValues = readCheckFilterForm(params);
  const draftValues = { ...appliedValues, ...edits };
  const needsReviewActive =
    filters.review_status === ApiModerationCheckReviewStatusEnum.NeedsReview;
  const caseId = needsReviewActive ? undefined : filters.case_id;
  const dirty = Object.entries(edits).some(
    ([name, value]) => value !== appliedValues[name]
  );
  function change(name: string, value: string) {
    setEdits((previous) => {
      const next = { ...previous };
      if (value === appliedValues[name]) delete next[name];
      else next[name] = value;
      return next;
    });
  }
  function toggleNeedsReview(checked: boolean) {
    const next = checkFilterFormParams(appliedValues, caseId);
    if (checked)
      next.set("review_status", ApiModerationCheckReviewStatusEnum.NeedsReview);
    else next.delete("review_status");
    setEdits((previous) => {
      const remaining = { ...previous };
      delete remaining["review_status"];
      return remaining;
    });
    onApply(next);
  }
  function clear() {
    setEdits({});
    onApply(new URLSearchParams());
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = checkFilterFormParams(draftValues, caseId);
    const toInput = event.currentTarget.elements.namedItem("to");
    if (toInput instanceof HTMLInputElement) {
      toInput.setCustomValidity(
        next.get("from") &&
          next.get("to") &&
          next.get("from")! > next.get("to")!
          ? t(locale, "checks.filter.invalidDate")
          : ""
      );
      if (!toInput.reportValidity()) return;
    }
    setEdits({});
    onApply(next);
  }
  return (
    <section
      aria-label={t(locale, "checks.filters")}
      className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-2 tw-px-4 tw-py-2">
        <label className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-3 tw-text-sm tw-font-semibold tw-text-iron-100">
          <input
            type="checkbox"
            role="switch"
            className="tw-peer tw-sr-only"
            checked={needsReviewActive}
            onChange={(event) => toggleNeedsReview(event.currentTarget.checked)}
          />
          <span
            aria-hidden="true"
            className={`tw-relative tw-h-6 tw-w-11 tw-shrink-0 tw-rounded-full peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${needsReviewActive ? "tw-bg-primary-500" : "tw-bg-iron-700"}`}
          >
            <span
              className={`tw-absolute tw-top-0.5 tw-h-5 tw-w-5 tw-rounded-full tw-bg-iron-50 ${needsReviewActive ? "tw-left-[1.375rem]" : "tw-left-0.5"}`}
            />
          </span>
          {t(locale, "checks.needsReviewOnly")}
        </label>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
          {dirty && (
            <output className="tw-text-xs tw-text-iron-400">
              {t(locale, "checks.unappliedChanges")}
            </output>
          )}
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={`${id}-filters`}
            onClick={() => setExpanded((value) => !value)}
            className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-text-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(locale, "checks.filters")}
            <ChevronDownIcon
              aria-hidden="true"
              className={`tw-h-4 tw-w-4 ${expanded ? "tw-rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>
      <form
        id={`${id}-filters`}
        hidden={!expanded}
        onSubmit={submit}
        className="tw-space-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-4"
      >
        {caseId && (
          <p className="tw-text-sm tw-text-iron-300">
            {t(locale, "checks.caseFilter")}
          </p>
        )}
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {Object.entries(CHECK_FILTER_OPTIONS).map(([name, options]) => (
            <label
              key={name}
              className="tw-space-y-2 tw-text-sm tw-text-iron-300"
            >
              <span>
                {t(
                  locale,
                  `checks.filter.${name as keyof typeof CHECK_FILTER_OPTIONS}`
                )}
              </span>
              <select
                name={name}
                value={draftValues[name] ?? ""}
                onChange={(event) => change(name, event.currentTarget.value)}
                className={checkControlClass}
              >
                <option value="">{t(locale, "checks.all")}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {checkValueLabel(locale, option)}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {(["from", "to"] as const).map((name) => (
            <label
              key={name}
              className="tw-space-y-2 tw-text-sm tw-text-iron-300"
            >
              <span>{t(locale, `checks.filter.${name}`)}</span>
              <input
                name={name}
                type="date"
                value={draftValues[name] ?? ""}
                onChange={(event) => {
                  clearFilterDateError(event.currentTarget.form);
                  change(name, event.currentTarget.value);
                }}
                className={checkControlClass}
              />
            </label>
          ))}
          {(["profile_id", "subject_id"] as const).map((name) => (
            <label
              key={name}
              className="tw-space-y-2 tw-text-sm tw-text-iron-300"
            >
              <span>{t(locale, `checks.filter.${name}`)}</span>
              <input
                name={name}
                value={draftValues[name] ?? ""}
                onChange={(event) => change(name, event.currentTarget.value)}
                pattern="[a-zA-Z0-9_:\-]+"
                maxLength={name === "subject_id" ? 200 : 128}
                autoComplete="off"
                aria-describedby={`${id}-help`}
                className={checkControlClass}
              />
            </label>
          ))}
        </div>
        <p id={`${id}-help`} className="tw-text-sm tw-text-iron-400">
          {t(locale, "checks.filter.idsHelp")}
        </p>
        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <button type="submit" className={checkButtonClass}>
            {t(locale, "checks.applyFilters")}
          </button>
          <button type="button" className={checkButtonClass} onClick={clear}>
            {t(locale, "checks.clearFilters")}
          </button>
        </div>
      </form>
    </section>
  );
}
