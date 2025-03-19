import React from 'react';
import { DropdownTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

export const DropdownTrait: React.FC<DropdownTraitProps> = ({
  label,
  field,
  traits,
  updateText,
  options,
  className,
}) => {
  return (
    <TraitWrapper label={label} className={className}>
      <select
        value={traits[field] as string || ""}
        onChange={(e) => updateText(field, e.target.value)}
        className="tw-form-select tw-w-2/3 tw-bg-iron-900 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-rounded-lg tw-px-3 tw-py-3 
          tw-text-sm tw-text-iron-100 tw-cursor-pointer tw-transition-all tw-shadow-inner
          focus:tw-ring-1 focus:tw-ring-primary-400 hover:tw-ring-primary-400"
      >
        <option value="" className="tw-bg-iron-950">
          Select {label}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="tw-bg-iron-950">
            {option}
          </option>
        ))}
      </select>
    </TraitWrapper>
  );
};