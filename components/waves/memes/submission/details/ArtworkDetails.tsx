import React, { useRef, useCallback } from "react";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";

interface ArtworkDetailsProps {
  readonly title: string;
  readonly description: string;
  readonly onTitleChange: (title: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly titleError?: string | null;
  readonly descriptionError?: string | null;
  readonly onTitleBlur?: () => void;
  readonly onDescriptionBlur?: () => void;
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
}) => {
  // Refs to track input elements directly
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Sync refs with props when they change
  React.useEffect(() => {
    if (titleRef.current && title && titleRef.current.value !== title) {
      titleRef.current.value = title;
    }
  }, [title]);

  React.useEffect(() => {
    if (
      descriptionRef.current &&
      description &&
      descriptionRef.current.value !== description
    ) {
      descriptionRef.current.value = description;
    }
  }, [description]);

  // Handle blur events - only update parent state when user finishes typing
  const handleTitleBlur = useCallback(() => {
    if (titleRef.current && titleRef.current.value !== title) {
      onTitleChange(titleRef.current.value);
    }
    // Call parent blur handler for validation
    if (onTitleBlur) {
      onTitleBlur();
    }
  }, [onTitleChange, title, onTitleBlur]);

  const handleDescriptionBlur = useCallback(() => {
    if (
      descriptionRef.current &&
      descriptionRef.current.value !== description
    ) {
      onDescriptionChange(descriptionRef.current.value);
    }
    // Call parent blur handler for validation
    if (onDescriptionBlur) {
      onDescriptionBlur();
    }
  }, [onDescriptionChange, description, onDescriptionBlur]);

  return (
    <FormSection
      title="Artwork Details"
      titleClassName="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-100 tw-mb-4 sm:tw-mb-6"
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-6">
        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="field-title"
              className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all
                ${
                  titleError
                    ? "tw-text-red"
                    : "tw-text-iron-300 group-focus-visible-within:tw-text-primary-400"
                }`}
            >
              Artwork Title
            </label>

            <div
              className={`tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200
              ${
                titleError
                  ? "tw-shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                  : "group-focus-visible-within:tw-shadow-[0_0_0_1px_rgba(139,92,246,0.05)]"
              }`}
            >
              <input
                ref={titleRef}
                id="field-title"
                name="title"
                type="text"
                maxLength={500}
                defaultValue={title || ""}
                onBlur={handleTitleBlur}
                placeholder="Enter artwork title"
                aria-invalid={!!titleError}
                aria-describedby={titleError ? "title-error" : undefined}
                data-field="title"
                className={`tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-transition-all tw-duration-500 tw-ease-in-out
                  tw-bg-iron-900 tw-border-0 tw-outline-none placeholder:tw-text-iron-500 tw-cursor-text tw-ring-1
                  ${
                    titleError
                      ? "tw-ring-red"
                      : "tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-650 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400"
                  }
                  
                  
                  `}
              />
            </div>
          </div>

          <ValidationError error={titleError} id="title-error" />
        </div>

        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="field-description"
              className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all
                ${
                  descriptionError
                    ? "tw-text-red"
                    : "tw-text-iron-300 group-focus-visible-within:tw-text-primary-400"
                }`}
            >
              Description
            </label>

            <div
              className={`tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200
              ${
                descriptionError
                  ? "tw-shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                  : "group-focus-visible-within:tw-shadow-[0_0_0_1px_rgba(139,92,246,0.05)]"
              }`}
            >
              <textarea
                ref={descriptionRef}
                id="field-description"
                name="description"
                defaultValue={description || ""}
                onBlur={handleDescriptionBlur}
                placeholder="Enter artwork description"
                rows={4}
                maxLength={500}
                aria-invalid={!!descriptionError}
                aria-describedby={
                  descriptionError ? "description-error" : undefined
                }
                data-field="description"
                className={`tw-form-textarea tw-w-full tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-transition-all tw-duration-500 tw-ease-in-out
                  tw-bg-iron-900 tw-border-0 tw-outline-none placeholder:tw-text-iron-500 tw-resize-none tw-cursor-text tw-ring-1
                  ${
                    descriptionError
                      ? "tw-ring-red"
                      : "tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-650 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400"
                  }
                  
                  
                  `}
              />
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
