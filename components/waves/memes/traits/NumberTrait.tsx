import React from 'react';
import { NumberTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

export const NumberTrait: React.FC<NumberTraitProps> = ({
  label,
  field,
  traits,
  updateNumber,
  readOnly = false,
  min = 0,
  max = 100,
  className,
}) => {
  return (
    <TraitWrapper label={label} readOnly={readOnly} className={className}>
      <input
        type="number"
        value={traits[field] as number || 0}
        onChange={(e) => updateNumber(field, Number(e.target.value))}
        min={min}
        max={max}
        readOnly={readOnly}
        className={`tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
          ${
            readOnly
              ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
              : "tw-bg-iron-900/80 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
          } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`}
      />
    </TraitWrapper>
  );
};