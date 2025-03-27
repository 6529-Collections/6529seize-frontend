import React from 'react';

/**
 * Props for the FileTypeIndicator component
 */
interface FileTypeIndicatorProps {
  readonly format: string;
}

/**
 * File Type Indicator Component
 * 
 * Displays a visual indicator for supported file formats.
 * Used in the upload area to show what types of files are accepted.
 * 
 * @param props Component props
 * @returns JSX Element
 */
const FileTypeIndicator: React.FC<FileTypeIndicatorProps> = ({ format }) => (
  <span 
    className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50"
  >
    {format}
  </span>
);

export default FileTypeIndicator;