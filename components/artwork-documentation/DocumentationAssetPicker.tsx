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
  const emptyHelpId = `${id}-empty`;
  const descriptions = [
    describedBy,
    assets.length === 0 ? emptyHelpId : undefined,
  ]
    .filter(Boolean)
    .join(" ");
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
        aria-describedby={descriptions || undefined}
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
      {assets.length === 0 && (
        <p
          id={emptyHelpId}
          className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300"
        >
          {msg("assetChoicesEmpty")}
          {id === "documentation-artwork-canonical_asset_id" && (
            <>
              {" "}
              <a
                href="#documentation-upload"
                className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-primary-300 tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                onClick={() =>
                  document.getElementById("documentation-upload")?.focus()
                }
              >
                {msg("assetChoicesUpload")}
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
