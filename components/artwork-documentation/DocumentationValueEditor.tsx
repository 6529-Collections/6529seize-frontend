"use client";

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
}

const languageEntry: ValueEditor = {
  kind: "object",
  fields: {
    language: { kind: "text", max: 64 },
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
          className="tw-h-5 tw-w-5 tw-accent-primary-400"
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
          className="tw-mb-2 tw-block tw-text-sm tw-text-iron-300"
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

function LocalizedEditor(
  props: Props & {
    readonly editor: Extract<ValueEditor, { kind: "localized" }>;
  }
) {
  const { id, editor, value, onChange, disabled } = props;
  const { msg } = useDocumentationMessages();
  const current = recordValue(value ?? initialValue(editor));
  return (
    <div className="tw-space-y-4">
      <DocumentationValueEditor
        id={`${id}-primary`}
        label={msg("primaryLanguage")}
        editor={{ kind: "text", max: 64 }}
        value={current["primary_language"]}
        disabled={disabled}
        onChange={(language) =>
          onChange({ ...current, primary_language: language })
        }
      />
      <ListEditor
        {...props}
        editor={{ kind: "list", max: 10, item: languageEntry }}
        value={current["versions"]}
        onChange={(versions) => onChange({ ...current, versions })}
      />
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
        className="tw-mb-2 tw-block tw-text-sm tw-text-iron-300"
      >
        {label}
      </label>
      {editor.kind === "text" && editor.multiline ? (
        <textarea
          {...shared}
          rows={5}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...shared}
          type={editor.kind === "number" ? "number" : "text"}
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
  const current = recordValue(props.value ?? initialValue({ kind: "date" }));
  const precision = current["precision"];
  const shape: ValueEditor = {
    kind: "object",
    fields: {
      precision: { kind: "choice", options: ["year", "month", "day", "range"] },
      ...(precision === "range"
        ? {
            endpoint_precision: {
              kind: "choice" as const,
              options: ["year", "month", "day"],
            },
          }
        : {}),
      start: { kind: "text", max: 10 },
      ...(precision === "range"
        ? { end: { kind: "text" as const, max: 10 } }
        : {}),
      approximate: { kind: "boolean" },
    },
  };
  return (
    <DocumentationValueEditor
      {...props}
      editor={shape}
      value={current}
      onChange={(value) => {
        const changed = recordValue(value);
        if (changed["precision"] !== "range") {
          delete changed["end"];
          delete changed["endpoint_precision"];
        }
        props.onChange(changed);
      }}
    />
  );
}
