"use client";
import type { DocumentationValueEditorProps as Props } from "./DocumentationValueEditor";
import {
  initialValue,
  recordValue,
  type FieldValue,
} from "@/lib/artwork-documentation/registry";
import { useId } from "react";
import {
  documentationFieldLabel,
  documentationOptionLabel,
} from "@/i18n/messages/artwork-documentation-fields";
import { inputClass, useDocumentationMessages } from "./DocumentationControls";
export default function DateEditor(props: Props) {
  const { msg } = useDocumentationMessages();
  const formatHintId = useId();
  const current = recordValue(props.value ?? initialValue({ kind: "date" }));
  const precision =
    typeof current["precision"] === "string" ? current["precision"] : "year";
  const endpointPrecision =
    typeof current["endpoint_precision"] === "string" &&
    ["year", "month", "day"].includes(current["endpoint_precision"])
      ? current["endpoint_precision"]
      : "day";
  const format = precision === "range" ? endpointPrecision : precision;
  const dateDescription = [props.describedBy, formatHintId]
    .filter(Boolean)
    .join(" ");
  const update = (field: string, value: FieldValue) => {
    const changed = { ...current, [field]: value };
    if (value === "") delete changed[field];
    if (changed["precision"] !== "range") {
      delete changed["end"];
      delete changed["endpoint_precision"];
    }
    props.onChange(changed);
  };
  return (
    <fieldset
      className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
      aria-describedby={props.describedBy}
    >
      <legend className="tw-sr-only">{props.label}</legend>
      <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <label className="tw-block tw-text-sm tw-text-iron-300">
          {msg("editorial.datePrecision")}
          <select
            className={inputClass + " tw-mt-2"}
            value={precision}
            disabled={props.disabled}
            onChange={(event) => update("precision", event.target.value)}
          >
            {["year", "month", "day", "range"].map((option) => (
              <option key={option} value={option}>
                {documentationOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        {precision === "range" && (
          <label className="tw-block tw-text-sm tw-text-iron-300">
            {documentationFieldLabel("endpoint_precision")}
            <select
              className={inputClass + " tw-mt-2"}
              value={
                typeof current["endpoint_precision"] === "string"
                  ? current["endpoint_precision"]
                  : ""
              }
              disabled={props.disabled}
              onChange={(event) =>
                update("endpoint_precision", event.target.value)
              }
            >
              <option value="">{msg("choose")}</option>
              {["year", "month", "day"].map((option) => (
                <option key={option} value={option}>
                  {documentationOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
        )}
        {(precision === "range" ? ["start", "end"] : ["start"]).map((field) => (
          <label key={field} className="tw-block tw-text-sm tw-text-iron-300">
            {msg(
              precision === "range"
                ? "editorial.date." + field
                : "editorial.date." + precision
            )}
            <input
              id={field === "start" ? props.id : props.id + "-end"}
              className={inputClass + " tw-mt-2"}
              type="text"
              placeholder={msg("editorial.dateFormat." + format)}
              value={typeof current[field] === "string" ? current[field] : ""}
              disabled={props.disabled}
              aria-describedby={dateDescription}
              onChange={(event) => update(field, event.target.value)}
            />
          </label>
        ))}
      </div>
      <p
        id={formatHintId}
        className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400"
      >
        {msg("editorial.dateFormatHelp", {
          format: msg("editorial.dateFormat." + format),
        })}
      </p>
      <label className="tw-mt-3 tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-text-sm tw-text-iron-300">
        <input
          type="checkbox"
          className="tw-h-5 tw-w-5 tw-shrink-0 tw-accent-primary-400"
          checked={current["approximate"] === true}
          disabled={props.disabled}
          onChange={(event) => update("approximate", event.target.checked)}
        />
        {msg("editorial.approximateDate")}
      </label>
      {props.editor.kind === "date" && props.editor.note && (
        <label className="tw-mt-4 tw-block tw-text-sm tw-text-iron-300">
          {msg("museum.dateNote")}
          <textarea
            className={`${inputClass} tw-mt-2`}
            rows={3}
            value={typeof current["note"] === "string" ? current["note"] : ""}
            onChange={(event) => update("note", event.target.value)}
            disabled={props.disabled}
          />
        </label>
      )}
    </fieldset>
  );
}
