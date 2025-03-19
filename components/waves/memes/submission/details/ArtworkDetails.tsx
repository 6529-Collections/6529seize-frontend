import React from "react";
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
 * and handles the input fields for title and description.
 */
const ArtworkDetails: React.FC<ArtworkDetailsProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}) => {
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
              value={title || ""}
              onChange={(e) => onTitleChange(e.target.value)}
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
              value={description || ""}
              onChange={(e) => onDescriptionChange(e.target.value)}
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

export default ArtworkDetails;