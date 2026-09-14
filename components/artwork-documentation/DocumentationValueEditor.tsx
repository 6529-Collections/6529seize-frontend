"use client";

import { useState } from "react";
import DocumentationLongText from "./DocumentationLongText";
import DateEditor from "./DocumentationDateEditor";
import ListEditor from "./DocumentationListEditor";
import AssetEditor from "./DocumentationAssetPicker";
import DocumentationLanguagePicker from "./DocumentationLanguagePicker";
import { DocumentationExampleExcerpt } from "./DocumentationFieldExample";
import type { DocumentationReferenceChoice } from "@/lib/artwork-documentation/catalogue";
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
export interface DocumentationValueEditorProps {
  readonly id: string;
  readonly label: string;
  readonly editor: ValueEditor;
  readonly value: FieldValue | undefined;
  readonly onChange: (value: FieldValue) => void;
  readonly disabled?: boolean | undefined;
  readonly assets?: readonly AssetChoice[] | undefined;
  readonly references?: readonly DocumentationReferenceChoice[] | undefined;
  readonly describedBy?: string | undefined;
  readonly hideLabel?: boolean | undefined;
  readonly examplePath?: string | undefined;
}

const languageEntry: Extract<ValueEditor, { kind: "object" }> = {
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

export default function DocumentationValueEditor(
  props: DocumentationValueEditorProps
) {
  const { editor } = props;
  if (editor.kind === "object")
    return <ObjectEditor {...props} editor={editor} />;
  if (editor.kind === "list")
    return (
      <ListEditor
        {...props}
        editor={editor}
        ValueEditorComponent={DocumentationValueEditor}
      />
    );
  if (editor.kind === "localized")
    return <LocalizedEditor {...props} editor={editor} />;
  if (editor.kind === "date") return <DateEditor {...props} />;
  if (editor.kind === "asset")
    return <AssetEditor {...props} editor={editor} />;
  if (editor.kind === "identity") return null;
  if (editor.kind === "language")
    return <DocumentationLanguagePicker {...props} />;
  if (editor.kind === "reference")
    return <ReferenceEditor {...props} editor={editor} />;
  if (editor.kind === "multi_choice")
    return <MultipleChoiceEditor {...props} editor={editor} />;
  if (editor.kind === "boolean")
    return <BooleanEditor {...props} editor={editor} />;
  if (editor.kind === "choice")
    return <ChoiceEditor {...props} editor={editor} />;
  return <ScalarEditor {...props} editor={editor} />;
}

function BooleanEditor(
  props: DocumentationValueEditorProps & {
    readonly editor: Extract<ValueEditor, { kind: "boolean" }>;
  }
) {
  const { id, label, value, onChange, disabled, describedBy } = props;
  const { msg } = useDocumentationMessages();
  if (props.editor.explicit)
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
          disabled={disabled}
          aria-describedby={describedBy}
          value={typeof value === "boolean" ? String(value) : ""}
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value === "true");
          }}
        >
          <option value="">{msg("choose")}</option>
          <option value="true">{documentationOptionLabel("yes")}</option>
          <option value="false">{documentationOptionLabel("no")}</option>
        </select>
      </div>
    );
  return (
    <label className="tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
      <input
        id={id}
        type="checkbox"
        className="tw-h-5 tw-w-5 tw-shrink-0 tw-accent-primary-400"
        checked={value === true}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function ChoiceEditor(
  props: DocumentationValueEditorProps & {
    readonly editor: Extract<ValueEditor, { kind: "choice" }>;
  }
) {
  const { id, label, editor, value, onChange, disabled, describedBy } = props;
  const { msg } = useDocumentationMessages();
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
}

function languageTag(value: FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function LocalizedEditor(
  props: DocumentationValueEditorProps & {
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
      {editor.max < 6000 && (
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
      )}
      {editor.max >= 6000 ? (
        <DocumentationLongText
          id={id}
          label={label}
          hideLabel={props.hideLabel}
          value={typeof primary["text"] === "string" ? primary["text"] : ""}
          language={
            typeof primary["language"] === "string"
              ? primary["language"]
              : undefined
          }
          max={editor.max}
          disabled={disabled}
          describedBy={describedBy}
          onChange={(text) => updatePrimary({ text })}
        />
      ) : (
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
      )}
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
                editor={{
                  ...languageEntry,
                  fields: {
                    ...languageEntry.fields,
                    text: { kind: "text", multiline: true, max: editor.max },
                  },
                }}
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

function MultipleChoiceEditor(
  props: DocumentationValueEditorProps & {
    readonly editor: Extract<ValueEditor, { kind: "multi_choice" }>;
  }
) {
  const selected = Array.isArray(props.value) ? props.value : [];
  return (
    <fieldset
      aria-describedby={props.describedBy}
      className="tw-m-0 tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-x-7 tw-gap-y-2 tw-border-0 tw-p-0 sm:tw-grid-cols-2"
    >
      <legend
        className={
          props.hideLabel ? "tw-sr-only" : "tw-mb-3 tw-text-sm tw-text-iron-300"
        }
      >
        {props.label}
      </legend>
      {props.editor.options.map((option) => (
        <label
          key={option.id}
          className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-start tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-py-4"
        >
          <input
            type="checkbox"
            className="tw-mt-1 tw-size-5 tw-shrink-0 tw-accent-primary-400"
            checked={selected.includes(option.id)}
            disabled={props.disabled}
            onChange={(event) =>
              props.onChange(
                event.target.checked
                  ? [...selected, option.id]
                  : selected.filter((value) => value !== option.id)
              )
            }
          />
          <span>
            <span className="tw-block tw-text-base tw-leading-6 tw-text-iron-100">
              {option.label}
            </span>
            {option.description && (
              <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
                {option.description}
              </span>
            )}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function ReferenceEditor(
  props: DocumentationValueEditorProps & {
    readonly editor: Extract<ValueEditor, { kind: "reference" }>;
  }
) {
  const { msg } = useDocumentationMessages();
  const choices = (props.references ?? []).filter(
    (choice) =>
      props.editor.target === "all" || choice.target === props.editor.target
  );
  const selected = (
    Array.isArray(props.value) ? props.value : [props.value]
  ).filter((value): value is string => typeof value === "string" && !!value);
  const missing = selected.filter(
    (id) => !choices.some((choice) => choice.id === id)
  );
  return (
    <div>
      <label
        htmlFor={props.id}
        className={
          props.hideLabel
            ? "tw-sr-only"
            : "tw-mb-2 tw-block tw-text-sm tw-text-iron-300"
        }
      >
        {props.label}
      </label>
      <select
        id={props.id}
        className={inputClass}
        value={props.editor.multiple ? selected : (selected[0] ?? "")}
        multiple={props.editor.multiple}
        disabled={props.disabled}
        aria-describedby={props.describedBy}
        onChange={(event) =>
          props.onChange(
            props.editor.multiple
              ? Array.from(
                  event.target.selectedOptions,
                  (option) => option.value
                )
              : event.target.value
          )
        }
      >
        {!props.editor.multiple && <option value="">{msg("choose")}</option>}
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.label}
          </option>
        ))}
        {missing.map((id) => (
          <option key={id} value={id}>
            {msg("museum.unresolvedReference", { id })}
          </option>
        ))}
      </select>
      {choices.length === 0 && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {msg(`museum.referenceHelp.${props.editor.target}`)}
        </p>
      )}
    </div>
  );
}

function scalarInputAttributes(
  editor: Extract<ValueEditor, { kind: "text" | "number" }>
) {
  if (editor.kind === "number")
    return {
      type: "number",
      min: editor.min,
      max: editor.max,
      step: editor.integer ? 1 : "any",
    };
  return { type: "text", dir: "auto" as const };
}

function ScalarEditor(
  props: DocumentationValueEditorProps & {
    readonly editor: Extract<ValueEditor, { kind: "text" | "number" }>;
  }
) {
  const { id, label, editor, value, onChange, disabled, describedBy } = props;
  if (editor.kind === "text" && editor.multiline && (editor.max ?? 0) >= 6000)
    return (
      <DocumentationLongText
        id={id}
        label={label}
        hideLabel={props.hideLabel}
        value={typeof value === "string" ? value : ""}
        max={editor.max ?? 6000}
        disabled={disabled}
        describedBy={describedBy}
        onChange={onChange}
      />
    );
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
          {...scalarInputAttributes(editor)}
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
  props: DocumentationValueEditorProps & {
    readonly editor: Extract<ValueEditor, { kind: "object" }>;
  }
) {
  const current = recordValue(props.value ?? initialValue(props.editor));
  const { msg } = useDocumentationMessages();
  const [initiallyPresent] = useState(() => new Set(Object.keys(current)));
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
  const fields = Object.entries(props.editor.fields).filter(
    ([key, editor]) =>
      editor.kind !== "identity" && visibleObjectField(key, current)
  );
  const primary = ([key]: (typeof fields)[number]) =>
    !props.editor.required ||
    props.editor.required.includes(key) ||
    initiallyPresent.has(key);
  const render = ([key, editor]: (typeof fields)[number]) => (
    <div key={key} className="tw-min-w-0">
      {props.examplePath && editor.kind !== "object" && (
        <DocumentationExampleExcerpt
          moduleId={props.examplePath.split(".")[0] ?? ""}
          fieldId={`${props.examplePath.split(".").slice(1).join(".")}.${key}`}
        />
      )}
      <DocumentationValueEditor
        {...props}
        hideLabel={false}
        id={`${props.id}-${key}`}
        label={editor.label ?? documentationFieldLabel(key)}
        describedBy={
          [
            props.describedBy,
            editor.guidance
              ? `documentation-nested-help-${props.id}-${key}`
              : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        editor={editor}
        examplePath={
          props.examplePath ? `${props.examplePath}.${key}` : undefined
        }
        value={current[key]}
        onChange={(value) => onFieldChange(key, value)}
      />
      {editor.guidance && (
        <p
          id={`documentation-nested-help-${props.id}-${key}`}
          className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400"
        >
          {editor.guidance}
        </p>
      )}
    </div>
  );
  const optional = fields.filter((field) => !primary(field));
  return (
    <fieldset
      aria-describedby={props.describedBy}
      className="tw-m-0 tw-min-w-0 tw-space-y-6 tw-border-0 tw-p-0"
    >
      <legend
        className={
          props.hideLabel
            ? "tw-sr-only"
            : "tw-mb-4 tw-text-base tw-font-medium tw-text-iron-100"
        }
      >
        {props.label}
      </legend>
      {!props.hideLabel && props.examplePath && (
        <DocumentationExampleExcerpt
          moduleId={props.examplePath.split(".")[0] ?? ""}
          fieldId={props.examplePath.split(".").slice(1).join(".")}
        />
      )}
      {fields.filter(primary).map(render)}
      {optional.length > 0 && (
        <details className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2">
          <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-sm tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-primary-400">
            {msg("museum.moreDetails", { count: optional.length })}
          </summary>
          <div className="tw-space-y-6 tw-py-4">{optional.map(render)}</div>
        </details>
      )}
    </fieldset>
  );
}

function visibleObjectField(
  key: string,
  current: Record<string, FieldValue>
): boolean {
  if (key === "entries" && "kind" in current)
    return current["kind"] === "entries_supplied";
  return !(key === "text" && current["kind"] === "caption_reference");
}
