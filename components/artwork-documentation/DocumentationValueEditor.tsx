"use client";

import { useId, useState } from "react";
import LanguageTagCorrection from "./DocumentationLanguageTagCorrection";
import { documentationLanguageName } from "./DocumentationRecordValue";
import {
  documentationFieldLabel,
  documentationOptionLabel,
} from "@/i18n/messages/artwork-documentation-fields";
import {
  initialValue,
  recordValue,
  type FieldValue,
  type ValueEditor,
} from "@/lib/artwork-documentation/registry";
import {
  DocumentationButton,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export interface AssetChoice {
  readonly id: string;
  readonly label: string;
}
interface Props {
  readonly id: string;
  readonly label: string;
  readonly editor: ValueEditor;
  readonly value: FieldValue | undefined;
  readonly onChange: (value: FieldValue) => void;
  readonly disabled?: boolean | undefined;
  readonly assets?: readonly AssetChoice[] | undefined;
  readonly describedBy?: string | undefined;
  readonly hideLabel?: boolean | undefined;
}

const languageEntry: ValueEditor = {
  kind: "object",
  fields: {
    text: { kind: "text", multiline: true },
    authorship: {
      kind: "choice",
      options: ["original", "artist_translation", "third_party_translation"],
    },
    approved_by_artist: { kind: "boolean" },
  },
};

export default function DocumentationValueEditor(props: Props) {
  const { id, label, editor, value, onChange, disabled, describedBy } = props;
  const { msg } = useDocumentationMessages();
  if (editor.kind === "object")
    return <ObjectEditor {...props} editor={editor} />;
  if (editor.kind === "list") return <ListEditor {...props} editor={editor} />;
  if (editor.kind === "localized")
    return <LocalizedEditor {...props} editor={editor} />;
  if (editor.kind === "date") return <DateEditor {...props} />;
  if (editor.kind === "asset")
    return <AssetEditor {...props} editor={editor} />;
  if (editor.kind === "boolean")
    return (
      <label className="tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
        <input
          id={id}
          type="checkbox"
          className="tw-h-5 tw-w-5 tw-shrink-0 tw-accent-primary-400"
          checked={value === true}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {label}
      </label>
    );
  if (editor.kind === "choice")
    return (
      <div>
        <label
          htmlFor={id}
          className={
            props.hideLabel
              ? "tw-sr-only"
              : "tw-mb-2 tw-block tw-text-sm tw-text-iron-300"
          }
        >
          {label}
        </label>
        <select
          id={id}
          className={inputClass}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{msg("choose")}</option>
          {editor.options.map((option) => (
            <option key={option} value={option}>
              {documentationOptionLabel(option)}
            </option>
          ))}
        </select>
      </div>
    );
  return <ScalarEditor {...props} editor={editor} />;
}

function languageTag(value: FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function LocalizedEditor(
  props: Props & {
    readonly editor: Extract<ValueEditor, { kind: "localized" }>;
  }
) {
  const { id, label, editor, value, onChange, disabled, describedBy } = props;
  const { msg, locale } = useDocumentationMessages();
  const [correctingIndex, setCorrectingIndex] = useState<number | null>(null);
  const current = recordValue(value ?? initialValue(editor));
  const versions = Array.isArray(current["versions"])
    ? current["versions"]
    : [];
  const found = versions.findIndex(
    (version) =>
      recordValue(version)["language"] === current["primary_language"]
  );
  const primaryIndex = found >= 0 ? found : 0;
  const primary = recordValue(versions[primaryIndex]);
  const updatePrimary = (changes: Record<string, FieldValue>) => {
    const next = { ...primary, ...changes };
    const updated = versions.length
      ? versions.map((version, index) =>
          index === primaryIndex ? next : version
        )
      : [next];
    onChange({ ...current, versions: updated });
  };
  const secondary = versions
    .map((version, index) => ({ version, index }))
    .filter(({ index }) => index !== primaryIndex);
  return (
    <div>
      <label
        htmlFor={id}
        className={
          props.hideLabel
            ? "tw-sr-only"
            : "tw-mb-2 tw-block tw-text-sm tw-text-iron-300"
        }
      >
        {label}
      </label>
      <textarea
        id={id}
        dir="auto"
        className={inputClass}
        rows={7}
        value={typeof primary["text"] === "string" ? primary["text"] : ""}
        lang={
          typeof primary["language"] === "string"
            ? primary["language"]
            : undefined
        }
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => updatePrimary({ text: event.target.value })}
      />
      <details className="tw-mt-3 tw-text-sm tw-text-iron-400">
        <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {msg("catalogue.languages")}
        </summary>
        <div className="tw-space-y-5 tw-py-3">
          <p className="tw-m-0 tw-max-w-prose tw-leading-7">
            {msg("chapters.languageHelp")}
          </p>
          <label className="tw-block tw-text-sm tw-text-iron-300">
            {msg("primaryLanguage")}
            <select
              id={id + "-primary"}
              className={`${inputClass} tw-mt-2`}
              value={languageTag(current["primary_language"])}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...current, primary_language: event.target.value })
              }
            >
              {versions.map((version, index) => {
                const language = recordValue(version)["language"];
                return (
                  <option
                    key={index}
                    value={languageTag(language)}
                    disabled={!languageTag(language)}
                  >
                    {documentationLanguageName(language, locale) ||
                      msg("chapters.languageNotSet")}
                  </option>
                );
              })}
            </select>
          </label>
          {!disabled && (
            <DocumentationButton
              secondary
              onClick={() => setCorrectingIndex(primaryIndex)}
            >
              {msg("chapters.changeLanguage")}
            </DocumentationButton>
          )}
          <DocumentationValueEditor
            id={id + "-authorship"}
            label={documentationFieldLabel("authorship")}
            editor={{
              kind: "choice",
              options: [
                "original",
                "artist_translation",
                "third_party_translation",
              ],
            }}
            value={primary["authorship"]}
            disabled={disabled}
            onChange={(authorship) => updatePrimary({ authorship })}
          />
          <DocumentationValueEditor
            id={id + "-approved"}
            label={documentationFieldLabel("approved_by_artist")}
            editor={{ kind: "boolean" }}
            value={primary["approved_by_artist"]}
            disabled={disabled}
            onChange={(approved_by_artist) =>
              updatePrimary({ approved_by_artist })
            }
          />
          {secondary.map(({ version, index }) => (
            <fieldset
              key={id + "-" + index}
              className="tw-min-w-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-0 tw-pt-5"
            >
              <legend className="tw-pr-3 tw-text-sm tw-text-iron-300">
                {msg("editorial.translation", { number: index + 1 })}
                {" · "}
                {documentationLanguageName(
                  recordValue(version)["language"],
                  locale
                ) || msg("chapters.languageNotSet")}
              </legend>
              {!disabled && (
                <DocumentationButton
                  secondary
                  className="tw-mb-4"
                  onClick={() => setCorrectingIndex(index)}
                >
                  {msg("chapters.changeLanguage")}
                </DocumentationButton>
              )}
              <DocumentationValueEditor
                {...props}
                hideLabel={false}
                id={id + "-version-" + index}
                editor={languageEntry}
                value={version}
                onChange={(next) =>
                  onChange({
                    ...current,
                    versions: versions.map((item, itemIndex) =>
                      itemIndex === index ? next : item
                    ),
                  })
                }
              />
              {!disabled && (
                <DocumentationButton
                  secondary
                  className="tw-mt-4"
                  onClick={() =>
                    onChange({
                      ...current,
                      versions: versions.filter(
                        (_, itemIndex) => itemIndex !== index
                      ),
                    })
                  }
                >
                  {msg("remove", { number: index + 1 })}
                </DocumentationButton>
              )}
            </fieldset>
          ))}
          {!disabled && (
            <DocumentationButton
              secondary
              disabled={versions.length >= 10}
              onClick={() =>
                onChange({
                  ...current,
                  versions: [
                    ...versions,
                    {
                      language: "",
                      text: "",
                      authorship: "artist_translation",
                      approved_by_artist: false,
                    },
                  ],
                })
              }
            >
              {msg("editorial.addTranslation")}
            </DocumentationButton>
          )}
        </div>
      </details>
      {correctingIndex !== null && !disabled && (
        <LanguageTagCorrection
          language={languageTag(
            recordValue(versions[correctingIndex])["language"]
          )}
          otherLanguages={versions.flatMap((version, index) =>
            index === correctingIndex
              ? []
              : [languageTag(recordValue(version)["language"])]
          )}
          onClose={() => setCorrectingIndex(null)}
          onApply={(language) => {
            onChange({
              ...current,
              ...(correctingIndex === primaryIndex
                ? { primary_language: language }
                : {}),
              versions: versions.map((version, index) =>
                index === correctingIndex
                  ? { ...recordValue(version), language }
                  : version
              ),
            });
            setCorrectingIndex(null);
          }}
        />
      )}
    </div>
  );
}

function AssetEditor(
  props: Props & { readonly editor: Extract<ValueEditor, { kind: "asset" }> }
) {
  const {
    id,
    label,
    editor,
    value,
    onChange,
    disabled,
    assets = [],
    describedBy,
  } = props;
  const { msg } = useDocumentationMessages();
  const selected = Array.isArray(value) ? value : [value];
  const singleValue = typeof value === "string" ? value : "";
  return (
    <div>
      <label htmlFor={id} className="tw-sr-only">
        {label}
      </label>
      <select
        id={id}
        className={inputClass}
        disabled={disabled}
        aria-describedby={describedBy}
        multiple={editor.multiple}
        value={editor.multiple ? selected.map(String) : singleValue}
        onChange={(event) =>
          onChange(
            editor.multiple
              ? Array.from(
                  event.target.selectedOptions,
                  (option) => option.value
                )
              : event.target.value
          )
        }
      >
        {!editor.multiple && <option value="">{msg("choose")}</option>}
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ScalarEditor(
  props: Props & {
    readonly editor: Extract<ValueEditor, { kind: "text" | "number" }>;
  }
) {
  const { id, label, editor, value, onChange, disabled, describedBy } = props;
  const shared = {
    id,
    className: inputClass,
    disabled,
    "aria-describedby": describedBy,
    value: typeof value === "string" || typeof value === "number" ? value : "",
  };
  return (
    <div>
      <label
        htmlFor={id}
        className={
          props.hideLabel
            ? "tw-sr-only"
            : "tw-mb-2 tw-block tw-text-sm tw-text-iron-300"
        }
      >
        {label}
      </label>
      {editor.kind === "text" && editor.multiline ? (
        <textarea
          {...shared}
          dir="auto"
          rows={5}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...shared}
          type={editor.kind === "number" ? "number" : "text"}
          dir={editor.kind === "text" ? "auto" : undefined}
          min={editor.kind === "number" ? 1 : undefined}
          onChange={(event) => {
            if (editor.kind !== "number") {
              onChange(event.target.value);
              return;
            }
            const numberValue = event.target.valueAsNumber;
            onChange(
              event.target.value === "" || !Number.isFinite(numberValue)
                ? ""
                : numberValue
            );
          }}
        />
      )}
    </div>
  );
}

function ObjectEditor(
  props: Props & { readonly editor: Extract<ValueEditor, { kind: "object" }> }
) {
  const current = recordValue(props.value);
  const onFieldChange = (key: string, value: FieldValue) => {
    const updated = { ...current, [key]: value };
    if (value === "") delete updated[key];
    if (key === "kind" && value === "caption_reference") delete updated["text"];
    if (
      key === "kind" &&
      (value === "none" || value === "unavailable") &&
      "entries" in props.editor.fields
    )
      updated["entries"] = [];
    if (
      key === "kind" &&
      (value === "none_known" || value === "unknown") &&
      "entries" in props.editor.fields
    )
      delete updated["entries"];
    props.onChange(updated);
  };
  return (
    <div className="tw-space-y-4">
      {Object.entries(props.editor.fields)
        .filter(([key]) => visibleObjectField(key, current))
        .map(([key, editor]) => (
          <DocumentationValueEditor
            key={key}
            {...props}
            hideLabel={false}
            id={`${props.id}-${key}`}
            label={documentationFieldLabel(key)}
            editor={editor}
            value={current[key]}
            onChange={(value) => onFieldChange(key, value)}
          />
        ))}
    </div>
  );
}

function visibleObjectField(
  key: string,
  current: Record<string, FieldValue>
): boolean {
  if (key === "entries") return current["kind"] === "entries_supplied";
  return !(key === "text" && current["kind"] === "caption_reference");
}

function ListEditor(
  props: Props & { readonly editor: Extract<ValueEditor, { kind: "list" }> }
) {
  const { msg } = useDocumentationMessages();
  const entries = Array.isArray(props.value) ? props.value : [];
  return (
    <div className="tw-space-y-4">
      {entries.map((entry, index) => (
        <fieldset
          key={`${props.id}-${index}`}
          className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-4"
        >
          <legend className="tw-px-2 tw-text-xs tw-text-iron-400">
            {msg("entry", { number: index + 1 })}
          </legend>
          <DocumentationValueEditor
            {...props}
            hideLabel={false}
            id={`${props.id}-${index}`}
            editor={props.editor.item}
            value={entry}
            onChange={(next) =>
              props.onChange(
                entries.map((item, itemIndex) =>
                  index === itemIndex ? next : item
                )
              )
            }
          />
          {!props.disabled && (
            <DocumentationButton
              secondary
              className="tw-mt-3"
              onClick={() =>
                props.onChange(
                  entries.filter((_, itemIndex) => itemIndex !== index)
                )
              }
            >
              {msg("remove", { number: index + 1 })}
            </DocumentationButton>
          )}
        </fieldset>
      ))}
      {!props.disabled && (
        <DocumentationButton
          secondary
          disabled={entries.length >= props.editor.max}
          onClick={() =>
            props.onChange([...entries, initialValue(props.editor.item)])
          }
        >
          {msg("add")}
        </DocumentationButton>
      )}
    </div>
  );
}

function DateEditor(props: Props) {
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
    </fieldset>
  );
}
