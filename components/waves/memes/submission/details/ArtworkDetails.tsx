"use client";

import React, { useRef, useCallback, useMemo } from "react";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import {
  METADATA_VALUE_DESCRIPTION_MAX_LENGTH,
  METADATA_VALUE_TITLE_MAX_LENGTH,
} from "../utils/submissionMetadata";

const TITLE_CHARACTER_DANGER_THRESHOLD = 245;
const DESCRIPTION_CHARACTER_DANGER_THRESHOLD = 7600;

interface ArtworkDetailsBaseProps {
  readonly title: string;
  readonly description: string;
  readonly onTitleChange: (title: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly titleError?: string | null | undefined;
  readonly descriptionError?: string | null | undefined;
  readonly onTitleBlur?: (() => void) | undefined;
  readonly onDescriptionBlur?: (() => void) | undefined;
  readonly showRequiredMarkers?: boolean | undefined;
  readonly size?: "default" | "sm" | undefined;
}

type ArtworkDetailsAdditionalActionProps =
  | {
      readonly showAdditionalActionPromised: true;
      readonly isAdditionalActionPromised: boolean;
      readonly onAdditionalActionPromisedChange: (value: boolean) => void;
    }
  | {
      readonly showAdditionalActionPromised?: false | undefined;
      readonly isAdditionalActionPromised?: boolean | undefined;
      readonly onAdditionalActionPromisedChange?: undefined;
    };

type ArtworkDetailsProps = ArtworkDetailsBaseProps &
  ArtworkDetailsAdditionalActionProps;

const getFieldStateClass = (hasError: boolean, isFilled: boolean): string => {
  if (hasError) {
    return "tw-ring-red";
  }

  if (isFilled) {
    return "tw-ring-emerald-600/45 desktop-hover:hover:tw-ring-emerald-600/55 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400";
  }

  return "tw-ring-iron-700 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650";
};

const getLabelStateClass = (hasError: boolean): string => {
  if (hasError) {
    return "tw-text-red";
  }

  return "group-focus-visible-within:tw-text-primary-400 tw-text-iron-300";
};

const FieldCharacterCount = ({
  length,
  maxLength,
  dangerThreshold,
}: {
  readonly length: number;
  readonly maxLength: number;
  readonly dangerThreshold: number;
}) => {
  const isAtLimit = length >= maxLength;
  const isDanger = length >= dangerThreshold;
  const isNearLimit = length >= Math.floor(maxLength * 0.9);
  let colorClass = "tw-text-iron-500";

  if (isNearLimit) {
    colorClass = "tw-text-amber-400";
  }

  if (isDanger) {
    colorClass = "tw-text-orange-400";
  }

  if (isAtLimit) {
    colorClass = "tw-text-red";
  }

  return (
    <div className="tw-mt-1.5 tw-flex tw-justify-end">
      <span className={`tw-text-xs tw-font-medium ${colorClass}`}>
        {length.toLocaleString()} / {maxLength.toLocaleString()}
      </span>
    </div>
  );
};

const AdditionalActionPromiseCheckbox = ({
  checked,
  onChange,
}: {
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}) => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.checked);
    },
    [onChange]
  );

  return (
    <label
      htmlFor="field-additional-action-promised"
      className="tw-mt-4 tw-flex tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-lg tw-bg-iron-900/70 tw-px-3 tw-py-3 tw-ring-1 tw-ring-iron-800 tw-transition-colors desktop-hover:hover:tw-ring-iron-700"
    >
      <input
        id="field-additional-action-promised"
        name="isAdditionalActionPromised"
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="tw-mt-0.5 tw-h-4 tw-w-4 tw-rounded tw-border-iron-700 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-500"
      />
      <span className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-sm tw-font-medium tw-text-iron-100">
          Additional Action
        </span>
        <span className="tw-text-xs tw-leading-5 tw-text-iron-400">
          Check this if the submission includes a real-world commitment, such as
          an event, donation, physical item, airdrop, or future deliverable.
        </span>
      </span>
    </label>
  );
};

/**
 * ArtworkDetails - Component for the artwork title and description fields
 *
 * Extreme simplification using uncontrolled inputs with refs for maximum performance
 */
const ArtworkDetails: React.FC<ArtworkDetailsProps> = (props) => {
  const {
    title,
    description,
    onTitleChange,
    onDescriptionChange,
    titleError,
    descriptionError,
    onTitleBlur,
    onDescriptionBlur,
    showRequiredMarkers = false,
    size = "default",
  } = props;
  const additionalActionPromiseProps =
    props.showAdditionalActionPromised === true
      ? {
          checked: props.isAdditionalActionPromised,
          onChange: props.onAdditionalActionPromisedChange,
        }
      : null;

  // Refs to track input elements directly
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const resizeDescriptionTextarea = useCallback(
    (textarea: HTMLTextAreaElement | null) => {
      if (!textarea) return;

      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    },
    []
  );

  // Sync refs with props when they change
  React.useEffect(() => {
    if (titleRef.current && titleRef.current.value !== title) {
      titleRef.current.value = title;
    }
  }, [title]);

  React.useEffect(() => {
    if (
      descriptionRef.current &&
      descriptionRef.current.value !== description
    ) {
      descriptionRef.current.value = description;
    }

    resizeDescriptionTextarea(descriptionRef.current);
  }, [description, resizeDescriptionTextarea]);

  // Handle blur events - only update parent state when user finishes typing
  const handleTitleBlur = useCallback(() => {
    // Call parent blur handler for validation
    if (onTitleBlur) {
      onTitleBlur();
    }
  }, [onTitleBlur]);

  const handleDescriptionBlur = useCallback(() => {
    // Call parent blur handler for validation
    if (onDescriptionBlur) {
      onDescriptionBlur();
    }
  }, [onDescriptionBlur]);

  const handleTitleInput = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      onTitleChange(event.currentTarget.value);
    },
    [onTitleChange]
  );

  const handleDescriptionInput = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = event.currentTarget;
      const nextDescription = textarea.value.slice(
        0,
        METADATA_VALUE_DESCRIPTION_MAX_LENGTH
      );

      if (textarea.value !== nextDescription) {
        textarea.value = nextDescription;
      }

      onDescriptionChange(nextDescription);
      resizeDescriptionTextarea(textarea);
    },
    [onDescriptionChange, resizeDescriptionTextarea]
  );

  // Check if fields are filled
  const isTitleFilled = useMemo(() => title.trim().length > 0, [title]);
  const isDescriptionFilled = useMemo(
    () => description.trim().length > 0,
    [description]
  );
  const titleStateClass = getFieldStateClass(
    Boolean(titleError),
    isTitleFilled
  );
  const descriptionStateClass = getFieldStateClass(
    Boolean(descriptionError),
    isDescriptionFilled
  );
  const titleLabelStateClass = getLabelStateClass(Boolean(titleError));
  const descriptionLabelStateClass = getLabelStateClass(
    Boolean(descriptionError)
  );
  const titleLength = title.length;
  const descriptionLength = description.length;

  return (
    <FormSection
      title="Artwork Details"
      titleClassName="tw-text-base tw-font-semibold tw-text-iron-100 tw-tracking-tight tw-mb-2"
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-8">
        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="field-title"
              className={`tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-font-medium tw-transition-all ${size === "sm" ? "tw-text-[11px]" : "tw-text-xs"} ${titleLabelStateClass}`}
            >
              Artwork Title
              {showRequiredMarkers && (
                <>
                  {" "}
                  <span aria-hidden="true" className="tw-text-iron-500">
                    *
                  </span>
                </>
              )}
            </label>

            <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
              <input
                ref={titleRef}
                id="field-title"
                name="title"
                type="text"
                maxLength={METADATA_VALUE_TITLE_MAX_LENGTH}
                defaultValue={title || ""}
                onInput={handleTitleInput}
                onBlur={handleTitleBlur}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? "title-error" : undefined}
                data-field="title"
                className={`tw-form-input tw-w-full tw-cursor-text tw-rounded-lg tw-border-0 tw-bg-iron-900 ${size === "sm" ? "tw-px-3 tw-py-2.5" : "tw-px-4 tw-py-3.5"} tw-text-base tw-text-iron-100 tw-outline-none tw-ring-1 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 sm:tw-text-sm ${titleStateClass} ${
                  isTitleFilled && !titleError ? "tw-pr-10" : ""
                } `}
              />

              {/* Title checkmark */}
              {isTitleFilled && !titleError && (
                <div
                  className={`tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center ${
                    size === "sm" ? "tw-right-2.5" : "tw-right-3"
                  }`}
                >
                  <CheckCircleIcon
                    className={`tw-flex-shrink-0 tw-text-emerald-500 ${
                      size === "sm"
                        ? "tw-h-[18px] tw-w-[18px]"
                        : "tw-h-5 tw-w-5"
                    }`}
                  />
                </div>
              )}
            </div>
            <FieldCharacterCount
              length={titleLength}
              maxLength={METADATA_VALUE_TITLE_MAX_LENGTH}
              dangerThreshold={TITLE_CHARACTER_DANGER_THRESHOLD}
            />
          </div>

          <ValidationError error={titleError} id="title-error" />
        </div>

        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="field-description"
              className={`tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-font-medium tw-transition-all ${size === "sm" ? "tw-text-[11px]" : "tw-text-xs"} ${descriptionLabelStateClass}`}
            >
              Description
              {showRequiredMarkers && (
                <>
                  {" "}
                  <span aria-hidden="true" className="tw-text-iron-500">
                    *
                  </span>
                </>
              )}
            </label>

            <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
              <textarea
                ref={descriptionRef}
                id="field-description"
                name="description"
                defaultValue={description || ""}
                onInput={handleDescriptionInput}
                onBlur={handleDescriptionBlur}
                rows={4}
                aria-invalid={!!descriptionError}
                aria-describedby={
                  descriptionError ? "description-error" : undefined
                }
                data-field="description"
                data-max-length={METADATA_VALUE_DESCRIPTION_MAX_LENGTH}
                className={`tw-form-textarea tw-w-full tw-cursor-text tw-resize-none tw-overflow-hidden tw-rounded-lg tw-border-0 tw-bg-iron-900 ${size === "sm" ? "tw-px-3 tw-py-2.5" : "tw-px-4 tw-py-3.5"} tw-text-base tw-text-iron-100 tw-outline-none tw-ring-1 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 sm:tw-text-sm ${descriptionStateClass} ${
                  isDescriptionFilled && !descriptionError ? "tw-pr-10" : ""
                } `}
              />

              {/* Description checkmark */}
              {isDescriptionFilled && !descriptionError && (
                <div
                  className={`tw-pointer-events-none tw-absolute ${
                    size === "sm"
                      ? "tw-right-2.5 tw-top-2.5"
                      : "tw-right-3 tw-top-3"
                  }`}
                >
                  <CheckCircleIcon
                    className={`tw-flex-shrink-0 tw-text-emerald-500 ${
                      size === "sm"
                        ? "tw-h-[18px] tw-w-[18px]"
                        : "tw-h-5 tw-w-5"
                    }`}
                  />
                </div>
              )}
            </div>
            <FieldCharacterCount
              length={descriptionLength}
              maxLength={METADATA_VALUE_DESCRIPTION_MAX_LENGTH}
              dangerThreshold={DESCRIPTION_CHARACTER_DANGER_THRESHOLD}
            />
          </div>

          <ValidationError error={descriptionError} id="description-error" />

          {additionalActionPromiseProps ? (
            <AdditionalActionPromiseCheckbox
              checked={additionalActionPromiseProps.checked}
              onChange={additionalActionPromiseProps.onChange}
            />
          ) : null}
        </div>
      </div>
    </FormSection>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(ArtworkDetails);
