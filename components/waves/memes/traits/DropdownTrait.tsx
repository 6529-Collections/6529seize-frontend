import React, { useCallback, useRef } from 'react';
import { DropdownTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';
import { TraitsData } from '../submission/types/TraitsData';

export const DropdownTrait: React.FC<DropdownTraitProps> = ({
  label,
  field,
  traits,
  updateText,
  options,
  className,
}) => {
  // Use a ref to keep track of the title and description at the time this dropdown is changed
  const preservedValuesRef = useRef<{title: string, description: string}>({
    title: traits.title || '',
    description: traits.description || ''
  });
  
  // Update preserved values when props change but we haven't modified them
  React.useEffect(() => {
    preservedValuesRef.current = {
      title: traits.title || preservedValuesRef.current.title || '',
      description: traits.description || preservedValuesRef.current.description || ''
    };
  }, [traits.title, traits.description]);
  
  // Enhanced update function that preserves title and description
  const safeUpdateText = useCallback((field: keyof TraitsData, value: string) => {
    // Preserve the current title/description when updating other fields
    console.log(`DropdownTrait ${field} changing to ${value}, preserving:`, preservedValuesRef.current);
    
    // Call the original updateText with an enhanced handler
    updateText(field, value);
    
    // Special handling to ensure title/description values are preserved when updating dropdown values
    if (field !== 'title' && field !== 'description') {
      // Use a timeout to ensure our preservation runs after the state update
      setTimeout(() => {
        if (traits.title !== preservedValuesRef.current.title) {
          console.log('Restoring title after dropdown change');
          updateText('title', preservedValuesRef.current.title);
        }
        if (traits.description !== preservedValuesRef.current.description) {
          console.log('Restoring description after dropdown change');
          updateText('description', preservedValuesRef.current.description);
        }
      }, 10);
    }
  }, [updateText, traits.title, traits.description]);
  
  return (
    <TraitWrapper label={label} className={className}>
      <select
        value={traits[field] as string || ""}
        onChange={(e) => {
          // Log before update
          console.log(`DropdownTrait ${field} changing to:`, e.target.value, "preserving title:", preservedValuesRef.current.title);
          
          // Update with our safe wrapper
          safeUpdateText(field, e.target.value);
        }}
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