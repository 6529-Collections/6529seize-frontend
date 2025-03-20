import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  // Use local state for the input field
  const [value, setValue] = useState<number>((traits[field] as number) || 0);
  
  // Store important values in refs
  const titleRef = useRef<string>(traits.title || '');
  const descriptionRef = useRef<string>(traits.description || '');
  
  // Update from props when needed
  useEffect(() => {
    // Keep a copy of title/description for preservation
    if (traits.title) titleRef.current = traits.title;
    if (traits.description) descriptionRef.current = traits.description;
    
    // Update local value when the trait changes
    const traitValue = (traits[field] as number) || 0;
    if (value !== traitValue) {
      setValue(traitValue);
    }
  }, [traits, value, field]);
  
  // Memoized change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    
    // Update local state
    setValue(newValue);
    
    // Create a snapshot of important values
    const preservedTitle = titleRef.current;
    const preservedDescription = descriptionRef.current;
    
    // Update the parent state
    updateNumber(field, newValue);
    
    // Protect important fields with a small delay
    setTimeout(() => {
      // Only add protection for title/description if we're not editing them directly
      if (field !== 'title' && field !== 'description') {
        // Check if important fields changed and restore them if needed
        if (traits.title !== preservedTitle && preservedTitle) {
          // Need to cast to any because updateNumber doesn't accept strings
          (updateNumber as any)('title', preservedTitle);
        }
        if (traits.description !== preservedDescription && preservedDescription) {
          (updateNumber as any)('description', preservedDescription);
        }
      }
    }, 0);
  }, [field, updateNumber, traits.title, traits.description]);
  
  return (
    <TraitWrapper label={label} readOnly={readOnly} className={className}>
      <input
        type="number"
        value={value}
        onChange={handleChange}
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