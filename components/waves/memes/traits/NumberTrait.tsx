import React, { useRef, useCallback } from 'react';
import { useDebounce } from 'react-use';
import { NumberTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

/**
 * Improved number input component with better UX for handling zero values
 * Without min/max constraints
 */
export const NumberTrait: React.FC<NumberTraitProps> = React.memo(({
  label,
  field,
  traits,
  updateNumber,
  readOnly = false,
  min,
  max,
  className,
  error,
  onBlur,
}) => {


  // Use a ref for direct DOM access
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update when props change
  React.useEffect(() => {
    const value = (traits[field] as number) ?? 0;
    // Update input value only if it's different to avoid cursor jumping
    if (inputRef.current && Number(inputRef.current.value) !== value) {
      inputRef.current.value = String(value);
    }
  }, [traits, field]);
  
  // Handle focus to clear the field when it contains just 0
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // When focusing, if the value is 0, clear the field for better UX
    if (e.target.value === '0') {
      e.target.value = '';
    }
  }, []);
  
  // Handle blur (when the user finishes typing)
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (inputRef.current) {
      // Get the current value from the input
      let newValue: number;
      
      // If the field is empty, default to 0
      if (inputRef.current.value === '') {
        newValue = 0;
        inputRef.current.value = '0';
      } else {
        newValue = Number(inputRef.current.value);
      }
      
      // Parse and validate the number
      if (isNaN(newValue)) {
        newValue = 0;
        inputRef.current.value = '0';
      }

      // Apply min/max constraints if provided
      if (min !== undefined && newValue < min) {
        newValue = min;
        inputRef.current.value = String(min);
      }
      
      if (max !== undefined && newValue > max) {
        newValue = max;
        inputRef.current.value = String(max);
      }
      
      // Only update if the value has changed
      if (newValue !== (traits[field] as number)) {
        updateNumber(field, newValue);
      }

      // Call parent onBlur if provided
      if (onBlur) {
        onBlur(field);
      }
    }
  }, [field, traits, updateNumber, min, max, onBlur]);
  
  // Store current input for debounce
  const [debouncedValue, setDebouncedValue] = React.useState<string>('');
  
  // Update traits when debounced value changes
  useDebounce(
    () => {
      if (debouncedValue !== '') {
        let newValue = Number(debouncedValue);
        if (!isNaN(newValue) && isFinite(newValue)) {
          // Apply min/max constraints if provided
          if (min !== undefined && newValue < min) {
            newValue = min;
          }
          
          if (max !== undefined && newValue > max) {
            newValue = max;
          }
          
          if (newValue !== (traits[field] as number)) {
            updateNumber(field, newValue);
          }
        }
      }
    },
    400, // 400ms is a good balance for typing pauses
    [debouncedValue]
  );
  
  // Handle change for typing and increment/decrement buttons
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDebouncedValue(e.target.value);
    
    // For increment/decrement buttons, also immediately update
    if (e.target.value !== '') {
      let newValue = Number(e.target.value);
      if (!isNaN(newValue) && isFinite(newValue)) {
        // Apply min/max constraints if provided
        if (min !== undefined && newValue < min) {
          newValue = min;
        }
        
        if (max !== undefined && newValue > max) {
          newValue = max;
        }
        
        updateNumber(field, newValue);
      }
    }
  }, [field, updateNumber, min, max]);
  
  return (
    <TraitWrapper label={label} readOnly={readOnly} className={className} error={error}>
      <input
        ref={inputRef}
        type="number"
        defaultValue={(traits[field] as number) ?? 0}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        readOnly={readOnly}
        min={min}
        max={max}
        className={`tw-form-input tw-w-full sm:tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
          ${
            readOnly
              ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
              : "tw-bg-iron-900/80 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
          } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`}
      />
    </TraitWrapper>
  );
});

NumberTrait.displayName = 'NumberTrait';
