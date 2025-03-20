import React, { useRef, useState, useEffect } from 'react';
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
  // Removed debug console logs
  
  // IMPORTANT: Initialize with the current trait value
  const [selectedValue, setSelectedValue] = useState<string>(() => {
    const initialValue = traits[field] as string;
    return initialValue || '';
  });
  
  // Store important values in refs
  const titleRef = useRef<string>(traits.title || '');
  const descriptionRef = useRef<string>(traits.description || '');
  const isDirtyRef = useRef<boolean>(false);
  
  // Update our local state when props change (but not if user has selected a value)
  useEffect(() => {
    // Safe access the trait value, ensuring it's a string
    const traitValue = (traits[field] as string) || '';
    
    // Only update if there's an actual trait value AND it's different from our current state
    // AND we haven't manually selected a value yet
    if (traitValue && traitValue !== selectedValue && !isDirtyRef.current) {
      setSelectedValue(traitValue);
    }
    
    // Always keep track of latest title/description
    if (traits.title) titleRef.current = traits.title;
    if (traits.description) descriptionRef.current = traits.description;
  }, [traits, field, selectedValue]);
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    
    // Update our local value immediately
    setSelectedValue(newValue);
    isDirtyRef.current = true;
    
    // Create a snapshot of important values
    const preservedTitle = titleRef.current;
    const preservedDescription = descriptionRef.current;
    
    // Update the parent state
    updateText(field, newValue);
    
    // Protect important fields after a short delay
    setTimeout(() => {
      // Protect important fields
      if (field !== 'title' && field !== 'description') {
        if (preservedTitle && traits.title !== preservedTitle) {
          updateText('title', preservedTitle);
        }
        if (preservedDescription && traits.description !== preservedDescription) {
          updateText('description', preservedDescription);
        }
      }
    }, 0);
  };
  
  // Force render helper - helps ensure selection is visible
  const [, forceUpdate] = useState<{}>({});
  useEffect(() => {
    // Force a re-render after a small delay when selectedValue changes
    if (selectedValue) {
      const timer = setTimeout(() => forceUpdate({}), 10);
      return () => clearTimeout(timer);
    }
  }, [selectedValue]);
  
  return (
    <TraitWrapper label={label} className={className}>
      <select
        value={selectedValue}
        onChange={handleChange}
        className="tw-form-select tw-w-2/3 tw-bg-iron-900 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-rounded-lg tw-px-3 tw-py-3 
          tw-text-sm tw-text-iron-100 tw-cursor-pointer tw-transition-all tw-shadow-inner
          focus:tw-ring-1 focus:tw-ring-primary-400 hover:tw-ring-primary-400"
      >
        <option value="" className="tw-bg-iron-950">
          Select {label}
        </option>
        {options.map((option) => (
          <option 
            key={option} 
            value={option} 
            className="tw-bg-iron-950"
            selected={selectedValue === option} // Explicitly set selected attribute
          >
            {option}
          </option>
        ))}
      </select>
      
      {/* Optional hidden value indicator for debugging */}
      {selectedValue ? (
        <div className="tw-hidden">Selected: {selectedValue}</div>
      ) : null}
    </TraitWrapper>
  );
};