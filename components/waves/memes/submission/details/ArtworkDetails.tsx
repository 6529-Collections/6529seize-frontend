"use client";

import React, { useRef, useCallback, useMemo } from "react";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface ArtworkDetailsProps {
  readonly title: string;
  readonly description: string;
  readonly onTitleChange: (title: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly titleError?: string | null | undefined;
  readonly descriptionError?: string | null | undefined;
  readonly onTitleBlur?: (() => void) | undefined;
  readonly onDescriptionBlur?: (() => void) | undefined;
  readonly size?: "default" | "sm" | undefined;
}

/**
 * ArtworkDetails - Component for the artwork title and description fields
 *
 * Extreme simplification using uncontrolled inputs with refs for maximum performance
 */
const ArtworkDetails: React.FC<ArtworkDetailsProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  titleError,
  descriptionError,
  onTitleBlur,
  onDescriptionBlur,
  size = "default",
}) => {
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
      onDescriptionChange(event.currentTarget.value);
      resizeDescriptionTextarea(event.currentTarget);
    },
    [onDescriptionChange, resizeDescriptionTextarea]
  );

  // Check if fields are filled
  const isTitleFilled = useMemo(() => title.trim().length > 0, [title]);
  const isDescriptionFilled = useMemo(
    () => description.trim().length > 0,
    [description]
  );

  return (
    <FormSection
      title="Artwork Details"
      titleClassName="tw-text-base tw-font-semibold tw-text-iron-100 tw-tracking-tight tw-mb-2"
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-6">
        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="field-title"
              className={`tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-font-medium tw-transition-all ${size === "sm" ? "tw-text-[11px]" : "tw-text-xs"} ${
                titleError
                  ? "tw-text-red"
                  : "group-focus-visible-within:tw-text-primary-400 tw-text-iron-300"
              }`}
            >
              Artwork Title <span className="tw-text-red">*</span>
            </label>

            <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
              <input
                ref={titleRef}
                id="field-title"
                name="title"
                type="text"
                maxLength={500}
                defaultValue={title || ""}
                onInput={handleTitleInput}
                onBlur={handleTitleBlur}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? "title-error" : undefined}
                data-field="title"
                className={`tw-form-input tw-w-full tw-cursor-text tw-rounded-lg tw-border-0 tw-bg-iron-900 ${size === "sm" ? "tw-px-3 tw-py-2.5" : "tw-px-4 tw-py-3.5"} tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 ${
                  titleError
                    ? "tw-ring-red"
                    : "tw-ring-iron-700 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650"
                } ${isTitleFilled && !titleError ? "tw-pr-10" : ""} `}
              />

              {/* Title checkmark */}
              {isTitleFilled && !titleError && (
                <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-transform">
                  <CheckCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-emerald-500" />
                </div>
              )}
            </div>
          </div>

          <ValidationError error={titleError} id="title-error" />
        </div>

        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="field-description"
              className={`tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-font-medium tw-transition-all ${size === "sm" ? "tw-text-[11px]" : "tw-text-xs"} ${
                descriptionError
                  ? "tw-text-red"
                  : "group-focus-visible-within:tw-text-primary-400 tw-text-iron-300"
              }`}
            >
              Description <span className="tw-text-red">*</span>
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
                maxLength={500}
                aria-invalid={!!descriptionError}
                aria-describedby={
                  descriptionError ? "description-error" : undefined
                }
                data-field="description"
                className={`tw-form-textarea tw-w-full tw-cursor-text tw-overflow-hidden tw-rounded-lg tw-border-0 tw-bg-iron-900 ${size === "sm" ? "tw-px-3 tw-py-2.5" : "tw-px-4 tw-py-3.5"} tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 ${
                  descriptionError
                    ? "tw-ring-red"
                    : "tw-ring-iron-700 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650"
                } ${isDescriptionFilled && !descriptionError ? "tw-pr-10" : ""} `}
              />

              {/* Description checkmark */}
              {isDescriptionFilled && !descriptionError && (
                <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-3">
                  <CheckCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-emerald-500" />
                </div>
              )}
            </div>
          </div>

          <ValidationError error={descriptionError} id="description-error" />
        </div>
      </div>
    </FormSection>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(ArtworkDetails);
