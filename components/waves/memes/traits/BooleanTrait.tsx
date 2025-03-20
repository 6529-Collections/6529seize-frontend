import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BooleanTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

export const BooleanTrait: React.FC<BooleanTraitProps> = ({
  label,
  field,
  traits,
  updateBoolean,
  className,
}) => {
  // Local state to ensure responsive UI
  const [value, setValue] = useState<boolean>(Boolean(traits[field]));
  
  // Store important values in refs
  const titleRef = useRef<string>(traits.title || '');
  const descriptionRef = useRef<string>(traits.description || '');
  
  // Update from props when needed
  useEffect(() => {
    // Preserve important fields
    if (traits.title) titleRef.current = traits.title;
    if (traits.description) descriptionRef.current = traits.description;
    
    // Update local value if trait value changed
    if (Boolean(traits[field]) !== value) {
      setValue(Boolean(traits[field]));
    }
  }, [traits, field, value]);
  
  // Handle button click with value preservation
  const handleSetValue = useCallback((newValue: boolean) => {
    // Update local state immediately
    setValue(newValue);
    
    // Create a snapshot of important values
    const preservedTitle = titleRef.current;
    const preservedDescription = descriptionRef.current;
    
    // Update parent state
    updateBoolean(field, newValue);
    
    // Protect important fields with a small delay
    setTimeout(() => {
      if (field !== 'title' && field !== 'description') {
        if (traits.title !== preservedTitle && preservedTitle) {
          (updateBoolean as any)('title', preservedTitle);
        }
        if (traits.description !== preservedDescription && preservedDescription) {
          (updateBoolean as any)('description', preservedDescription);
        }
      }
    }, 0);
  }, [field, updateBoolean, traits.title, traits.description]);
  
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
        >
          No
        </button>
      </div>
    </TraitWrapper>
  );
};