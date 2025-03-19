import React from 'react';
import { SectionProps } from './types';

export const Section: React.FC<SectionProps> = ({
  title,
  children,
}) => {
  return (
    <div className="tw-mt-6 tw-first:tw-mt-0">
      <div className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-4">
        {title}
      </div>
      {children}
    </div>
  );
};