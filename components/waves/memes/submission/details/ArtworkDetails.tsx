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
      titleClassName="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-100 tw-mb-2 sm:tw-mb-4"
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-4">
        <div className="tw-bg-iron-900/50 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors tw-ring-iron-800/5">
          <div className="tw-flex sm:tw-items-center tw-gap-x-6 tw-flex-col sm:tw-flex-row tw-gap-y-1.5">
            <label
              htmlFor="field-title"
              className="sm:tw-w-1/3 tw-text-sm tw-font-medium tw-text-iron-300"
            >
              Artwork Title
            </label>
            <div className="tw-flex tw-flex-col sm:tw-w-2/3">
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
                className={`tw-form-input tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
                tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500
                ${
                  titleError
                    ? "tw-ring-red"
                    : "tw-ring-iron-700/60 hover:tw-ring-primary-400 focus:tw-ring-primary-400"
                }`}
              />
              <ValidationError
                error={titleError}
                id="title-error"
                className="tw-mt-1"
              />
            </div>
          </div>
        </div>
        <div className="tw-bg-iron-900/50 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors tw-ring-iron-800/5">
          <div className="tw-flex sm:tw-items-center tw-gap-x-6 tw-flex-col sm:tw-flex-row tw-gap-y-1.5">
            <label
              htmlFor="field-description"
              className="sm:tw-w-1/3 tw-text-sm tw-font-medium sm:tw-mt-2 tw-text-iron-300"
            >
              Description
            </label>
            <div className="tw-flex tw-flex-col sm:tw-w-2/3">
              <textarea
                ref={descriptionRef}
                id="field-description"
                name="description"
                defaultValue={description || ""}
                onBlur={handleDescriptionBlur}
                placeholder="Enter artwork description"
                rows={3}
                maxLength={500}
                aria-invalid={!!descriptionError}
                aria-describedby={
                  descriptionError ? "description-error" : undefined
                }
                data-field="description"
                className={`tw-form-textarea tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
                tw-bg-iron-900 tw-cursor-text tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500
                ${
                  descriptionError
                    ? "tw-ring-red"
                    : "tw-ring-iron-700/60 hover:tw-ring-primary-400 focus:tw-ring-primary-400"
                }`}
              />
              <ValidationError
                error={descriptionError}
                id="description-error"
                className="tw-mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(ArtworkDetails);
