"use client";
import type { DocumentationValueEditorProps } from "./DocumentationValueEditor";
import type { ValueEditor } from "@/lib/artwork-documentation/registry";
import { inputClass, useDocumentationMessages } from "./DocumentationControls";
export default function AssetEditor(
  props: DocumentationValueEditorProps & {
    readonly editor: Extract<ValueEditor, { kind: "asset" }>;
  }
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
