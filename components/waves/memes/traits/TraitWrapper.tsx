import React from 'react';
import { TraitWrapperProps } from './types';

export const TraitWrapper: React.FC<TraitWrapperProps> = ({
  label,
  readOnly = false,
  children,
  isBoolean = false,
  className,
}) => {
  return (
    <div className={`tw-bg-iron-900/50 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset ${isBoolean ? 'tw-ring-iron-800/40' : 'tw-ring-iron-800/5'} tw-transition-colors ${className || ''}`}>
      <div className={`${isBoolean ? 'tw-flex tw-items-center' : 'tw-flex tw-items-center tw-gap-x-6'}`}>
        <label
          className={`${isBoolean ? 'tw-text-sm tw-text-iron-200 tw-w-1/3 tw-font-medium' : `tw-w-1/3 tw-text-sm tw-font-medium ${
            readOnly ? "tw-text-iron-400" : "tw-text-iron-300"
          }`}`}
        >
          {label}
        </label>
        {children}
      </div>
    </div>
  );
};