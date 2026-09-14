"use client";

import { useState } from "react";
import type { DocumentationValueEditorProps } from "./DocumentationValueEditor";
import LanguageTagCorrection from "./DocumentationLanguageTagCorrection";
import { documentationLanguageName } from "./DocumentationRecordValue";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationLanguagePicker(
  props: DocumentationValueEditorProps
) {
  const { msg, locale } = useDocumentationMessages();
  const [opened, setOpened] = useState(false);
  const value = typeof props.value === "string" ? props.value : "";
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
      <DocumentationButton
        id={props.id}
        secondary
        disabled={props.disabled}
        aria-describedby={props.describedBy}
        onClick={() => setOpened(true)}
      >
        {value
          ? documentationLanguageName(value, locale)
          : msg("museum.chooseLanguage")}
      </DocumentationButton>
      {opened && (
        <LanguageTagCorrection
          language={value}
          otherLanguages={[]}
          onClose={() => setOpened(false)}
          onApply={(language) => {
            props.onChange(language);
            setOpened(false);
          }}
        />
      )}
    </div>
  );
}
