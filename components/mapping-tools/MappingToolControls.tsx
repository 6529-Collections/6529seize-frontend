"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type DragEvent, useRef, useState } from "react";
import styles from "./MappingTool.module.css";

interface MappingToolUploadProps {
  readonly fileName?: string | undefined;
  readonly onFileSelected: (file: File) => void;
}

export function MappingToolUpload({
  fileName,
  onFileSelected,
}: MappingToolUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = () => {
    inputRef.current?.click();
  };

  const handleDrag = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-px-3">
          Upload File <span className="tw-text-iron-400">(.csv)</span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2">
        <div className="tw-w-full tw-px-3">
          <button
            type="button"
            className={`${styles["uploadArea"]} ${
              dragActive ? styles["uploadAreaActive"] : ""
            }`}
            onClick={handleUpload}
            onDrop={handleDrop}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
          >
            <div>
              <FontAwesomeIcon
                icon={faFileUpload}
                className={styles["uploadIcon"]}
              />
            </div>
            {fileName ? (
              <div>{fileName}</div>
            ) : (
              <div>Drag and drop your file here, or click to upload</div>
            )}
          </button>
        </div>
      </div>
      {/* Test harnesses and browser extensions can add attributes (for
          example an inline caret-color) to this server-rendered input before
          React hydrates it; that is not a mismatch worth a console error. */}
      <input
        ref={inputRef}
        suppressHydrationWarning
        className={`tw-form-input ${styles["formInputHidden"]}`}
        type="file"
        accept=".csv"
        aria-label="Upload CSV file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
        }}
      />
    </>
  );
}

interface MappingToolSubmitButtonProps {
  readonly disabled: boolean;
  readonly processing: boolean;
  readonly onSubmit: () => void;
}

export function MappingToolSubmitButton({
  disabled,
  processing,
  onSubmit,
}: MappingToolSubmitButtonProps) {
  return (
    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-3">
      <div className="tw-w-full tw-px-3">
        <button
          type="button"
          className={`${styles["submitBtn"]} ${
            disabled ? styles["submitBtnDisabled"] : ""
          }`}
          disabled={disabled}
          onClick={onSubmit}
        >
          {processing ? "Processing" : "Submit"}
          {processing && (
            <div className="tw-inline">
              <output
                className={`tw-inline-block tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-current tw-border-r-transparent ${styles["loader"]}`}
              >
                <span className="tw-sr-only"></span>
              </output>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export type MappingToolErrorKind = "dataLoadFailed" | "fileReadFailed";

interface MappingToolErrorProps {
  readonly error: MappingToolErrorKind | null;
}

export function MappingToolError({ error }: MappingToolErrorProps) {
  const locale = useBrowserLocale();

  if (!error) {
    return null;
  }

  return (
    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-3">
      <div className="tw-w-full tw-px-3">
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {t(locale, `mappingTools.error.${error}`)}
        </p>
      </div>
    </div>
  );
}
