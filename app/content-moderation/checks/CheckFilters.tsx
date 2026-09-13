"use client";

import { useId, type FormEvent } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  CHECK_FILTER_OPTIONS,
  checkValueLabel,
  checkControlClass,
  checkButtonClass,
  readCheckFilters,
} from "./checks.helpers";

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
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value) next.set(key, value);
    }
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
    onApply(next);
  }
  return (
    <details
      className="tw-mt-6 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
      open={Object.keys(filters).length > 0}
    >
      <summary className="tw-min-h-11 tw-cursor-pointer tw-content-center tw-text-sm tw-font-semibold tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        {t(locale, "checks.filters")}
      </summary>
      <form onSubmit={submit} className="tw-mt-3 tw-space-y-4">
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
                defaultValue={String(
                  filters[name as keyof typeof CHECK_FILTER_OPTIONS] ?? ""
                )}
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
                defaultValue={params.get(name) ?? ""}
                onChange={(event) => event.currentTarget.setCustomValidity("")}
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
                defaultValue={String(filters[name] ?? "")}
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
          <button
            type="button"
            className={checkButtonClass}
            onClick={() => onApply(new URLSearchParams())}
          >
            {t(locale, "checks.clearFilters")}
          </button>
        </div>
      </form>
    </details>
  );
}
