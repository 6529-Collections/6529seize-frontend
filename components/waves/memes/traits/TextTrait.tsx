import React from 'react';
import { TextTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

export const TextTrait: React.FC<TextTraitProps> = ({
  label,
  field,
  traits,
  updateText,
  readOnly = false,
  placeholder,
  className,
}) => {
  return (
    <TraitWrapper label={label} readOnly={readOnly} className={className}>
      <input
        type="text"
        value={traits[field] as string || ""}
        onChange={(e) => updateText(field, e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        readOnly={readOnly}
        className={`tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
          ${
            readOnly
              ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
              : "tw-bg-iron-900 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
          } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`}
      />
    </TraitWrapper>
  );
};