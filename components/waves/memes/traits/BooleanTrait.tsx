import React, { useCallback } from 'react';
import { BooleanTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

/**
 * Simplified BooleanTrait component
 * Boolean traits are simpler and don't need uncontrolled approach
 */
export const BooleanTrait: React.FC<BooleanTraitProps> = React.memo(({
  label,
  field,
  traits,
  updateBoolean,
  className,
}) => {
  // For booleans, we can directly read from the traits
  const value = Boolean(traits[field]);
  
  // Simple click handler - direct state update is fine for buttons
  const handleSetValue = useCallback((newValue: boolean) => {
    updateBoolean(field, newValue);
  }, [field, updateBoolean]);
  
  return (
    <TraitWrapper label={label} isBoolean={true} className={className}>
      <div className="tw-flex tw-gap-3 tw-flex-1">
        <button
          onClick={() => handleSetValue(true)}
          className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              value
                ? "tw-bg-emerald-600/30 tw-ring-emerald-500/60 tw-text-emerald-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
          type="button"
        >
          Yes
        </button>
        <button
          onClick={() => handleSetValue(false)}
          className={`tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              !value
                ? "tw-bg-rose-600/30 tw-ring-rose-500/60 tw-text-rose-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
          type="button"
        >
          No
        </button>
      </div>
    </TraitWrapper>
  );
});