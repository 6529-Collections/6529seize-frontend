import React, { useRef, useEffect, useCallback, useState } from "react";
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
 * This component uses the FormSection component for consistent styling
 * and handles the input fields for title and description with robust state management.
 */
const ArtworkDetails: React.FC<ArtworkDetailsProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}) => {
  // Refs to track if fields have been edited by the user
  const titleEditedRef = useRef<boolean>(false);
  const descriptionEditedRef = useRef<boolean>(false);
  
  // Refs to store the latest values
  const titleRef = useRef<string>(title || '');
  const descriptionRef = useRef<string>(description || '');
  
  // Local state for controlled components
  const [titleValue, setTitleValue] = useState<string>(title || '');
  const [descriptionValue, setDescriptionValue] = useState<string>(description || '');
  
  // Memoized update handlers
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("Title changed to:", newValue);
    
    // Update both state and ref
    setTitleValue(newValue);
    titleRef.current = newValue;
    titleEditedRef.current = true;
  }, []);
  
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log("Description changed to:", newValue);
    
    // Update both state and ref
    setDescriptionValue(newValue);
    descriptionRef.current = newValue;
    descriptionEditedRef.current = true;
  }, []);
  
  // Memoized blur handlers
  const handleTitleBlur = useCallback(() => {
    console.log("Title input blurred, sending value:", titleRef.current);
    onTitleChange(titleRef.current);
  }, [onTitleChange]);
  
  const handleDescriptionBlur = useCallback(() => {
    console.log("Description input blurred, sending value:", descriptionRef.current);
    onDescriptionChange(descriptionRef.current);
  }, [onDescriptionChange]);
  
  // Update local state from props, but only if the user hasn't edited the field
  useEffect(() => {
    if (!titleEditedRef.current && title !== undefined && title !== null && title !== titleValue) {
      console.log("ArtworkDetails: Updating title from props:", title);
      setTitleValue(title);
      titleRef.current = title;
    }
  }, [title, titleValue]);
  
  useEffect(() => {
    if (!descriptionEditedRef.current && description !== undefined && description !== null && description !== descriptionValue) {
      console.log("ArtworkDetails: Updating description from props:", description);
      setDescriptionValue(description);
      descriptionRef.current = description;
    }
  }, [description, descriptionValue]);
  
  // Send our values to parent on mount and unmount to ensure they're preserved
  useEffect(() => {
    return () => {
      // On unmount, make sure parent has our latest values
      if (titleRef.current) onTitleChange(titleRef.current);
      if (descriptionRef.current) onDescriptionChange(descriptionRef.current);
    };
  }, [onTitleChange, onDescriptionChange]);

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
              type="text"
              value={titleValue}
              onChange={handleTitleChange}
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
              value={descriptionValue}
              onChange={handleDescriptionChange}
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

export default React.memo(ArtworkDetails);