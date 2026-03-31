import type { SubmissionMediaCategory } from '@/constants/submission-media.constants';
import {
  CubeIcon,
  FilmIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

/**
 * Props for the FileTypeIndicator component
 */
interface FileTypeIndicatorProps {
  readonly kind: SubmissionMediaCategory;
  readonly label: string;
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
const ICON_BY_KIND: Record<SubmissionMediaCategory, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  image: PhotoIcon,
  video: FilmIcon,
  interactive: CubeIcon,
};

const FileTypeIndicator: React.FC<FileTypeIndicatorProps> = ({
  kind,
  label,
}) => {
  const Icon = ICON_BY_KIND[kind];

  return (
    <span
      className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-text-[10px] tw-font-semibold tw-text-iron-400 tw-tracking-wider tw-bg-iron-800/50 tw-border tw-border-iron-800 tw-rounded-full tw-border-solid"
    >
      <Icon
        className="tw-size-4 tw-flex-shrink-0 tw-text-iron-500"
        aria-hidden="true"
      />
      <span className="tw-whitespace-nowrap">{label}</span>
    </span>

  );
};

export default FileTypeIndicator;
