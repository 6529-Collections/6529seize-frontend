"use client";
import type { DocumentationValueEditorProps as Props } from "./DocumentationValueEditor";
import {
  initialValue,
  recordValue,
  type FieldValue,
  type ValueEditor,
} from "@/lib/artwork-documentation/registry";
import type { ComponentType } from "react";
import DocumentationCollectionEntry from "./DocumentationCollectionEntry";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";
function entryKey(entry: FieldValue, index: number): string | number {
  const id = recordValue(entry)["id"];
  return typeof id === "string" ? id : index;
}
export default function ListEditor(
  props: Props & {
    readonly editor: Extract<ValueEditor, { kind: "list" }>;
    readonly ValueEditorComponent: ComponentType<Props>;
  }
) {
  const { msg } = useDocumentationMessages();
  const Editor = props.ValueEditorComponent;
  const entries = Array.isArray(props.value) ? props.value : [];
  const collection =
    props.editor.item.kind === "object" &&
    props.editor.item.fields["id"]?.kind === "identity";
  const renderEntry = (entry: FieldValue, index: number) => (
    <>
      <Editor
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
    </>
  );
  return (
    <div className="tw-space-y-4">
      {entries.map((entry, index) =>
        collection ? (
          <DocumentationCollectionEntry
            key={entryKey(entry, index)}
            value={entry}
            number={index + 1}
            label={props.editor.item.label}
          >
            {renderEntry(entry, index)}
          </DocumentationCollectionEntry>
        ) : (
          <fieldset
            key={`${props.id}-${index}`}
            className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-4"
          >
            <legend className="tw-px-2 tw-text-xs tw-text-iron-400">
              {props.editor.item.label
                ? msg("museum.namedEntry", {
                    label: props.editor.item.label,
                    number: index + 1,
                  })
                : msg("entry", { number: index + 1 })}
            </legend>
            {renderEntry(entry, index)}
          </fieldset>
        )
      )}
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
