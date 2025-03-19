import React from 'react';
import { BooleanTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

export const BooleanTrait: React.FC<BooleanTraitProps> = ({
  label,
  field,
  traits,
  updateBoolean,
  className,
}) => {
  return (
    <TraitWrapper label={label} isBoolean={true} className={className}>
      <div className="tw-flex tw-gap-3 tw-flex-1">
        <button
          onClick={() => updateBoolean(field, true)}
          className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              traits[field]
                ? "tw-bg-emerald-600/30 tw-ring-emerald-500/60 tw-text-emerald-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
        >
          Yes
        </button>
        <button
          onClick={() => updateBoolean(field, false)}
          className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              !traits[field]
                ? "tw-bg-rose-600/30 tw-ring-rose-500/60 tw-text-rose-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
        >
          No
        </button>
      </div>
    </TraitWrapper>
  );
};