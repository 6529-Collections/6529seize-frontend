import React, { useRef, useCallback } from "react";
import FormSection from "../ui/FormSection";

interface ArtworkDetailsProps {
  readonly title: string;
  readonly description: string;
  readonly onTitleChange: (title: string) => void;
  readonly onDescriptionChange: (description: string) => void;
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
    if (descriptionRef.current && description && descriptionRef.current.value !== description) {
      descriptionRef.current.value = description;
    }
  }, [description]);
  
  // Handle blur events - only update parent state when user finishes typing
  const handleTitleBlur = useCallback(() => {
    if (titleRef.current && titleRef.current.value !== title) {
      onTitleChange(titleRef.current.value);
    }
  }, [onTitleChange, title]);
  
  const handleDescriptionBlur = useCallback(() => {
    if (descriptionRef.current && descriptionRef.current.value !== description) {
      onDescriptionChange(descriptionRef.current.value);
    }
  }, [onDescriptionChange, description]);

  return (
    <FormSection 
      title="Artwork Details"
      titleClassName="tw-text-xl tw-font-semibold tw-text-iron-100 tw-mb-4"
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-4">
        <div className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors">
          <div className="tw-flex tw-items-center tw-gap-x-6">
            <label className="tw-w-1/3 tw-text-sm tw-font-medium tw-text-iron-300">
              Artwork Title
            </label>
            <input
              ref={titleRef}
              type="text"
              defaultValue={title || ''}
              onBlur={handleTitleBlur}
              placeholder="Enter artwork title"
              className="tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
                tw-bg-iron-900 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400
                tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500"
            />
          </div>
        </div>
        <div className="tw-bg-iron-900/50 tw-ring-iron-800/5 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-transition-colors">
          <div className="tw-flex tw-items-start tw-gap-x-6">
            <label className="tw-w-1/3 tw-text-sm tw-font-medium tw-text-iron-300 tw-mt-2">
              Description
            </label>
            <textarea
              ref={descriptionRef}
              defaultValue={description || ''}
              onBlur={handleDescriptionBlur}
              placeholder="Enter artwork description"
              rows={3}
              className="tw-form-textarea tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
                tw-bg-iron-900 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400
                tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500"
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(ArtworkDetails);