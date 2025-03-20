import React, { useRef, useCallback, useState, useMemo } from 'react';
import { TextTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

// Create a debounced input handler
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T, 
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
      timeoutRef.current = null;
    }, delay);
  }, [callback, delay]);
}

export const TextTrait: React.FC<TextTraitProps> = React.memo(({
  label,
  field,
  traits,
  updateText,
  readOnly = false,
  placeholder,
  className,
}) => {
  // Use a ref to track the latest value independently of render cycles
  const valueRef = useRef<string>((traits[field] as string) || '');
  
  // Controlled component state - initializes from props but then manages locally
  const [fieldValue, setFieldValue] = useState<string>(() => (traits[field] as string) || '');
  
  // Track if the field has been edited by the user
  const hasBeenEditedRef = useRef<boolean>(false);
  
  // Memoized update function that won't change on rerenders
  const updateParentState = useCallback(() => {
    if (hasBeenEditedRef.current && valueRef.current !== (traits[field] as string)) {
      // Completely removed console logging
      // if (process.env.NODE_ENV === 'development') {
      //   console.log(`TextTrait ${field} updating parent`);
      // }
      updateText(field, valueRef.current);
    }
  }, [field, updateText, traits]);
  
  // Create a debounced version of updateParentState
  const debouncedUpdateParent = useDebouncedCallback(updateParentState, 200);
  
  // Only update from props if we haven't been edited AND the prop value changed
  React.useEffect(() => {
    const propValue = (traits[field] as string) || '';
    
    // Skip if we're currently editing this field
    if ((field === 'title' || field === 'description') && hasBeenEditedRef.current) {
      return;
    }
    
    // Only update if different
    if (propValue !== valueRef.current && propValue !== '') {
      valueRef.current = propValue;
      setFieldValue(propValue);
    }
  }, [traits, field]);
  
  // Handle input changes with optimized performance
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Update both our ref and state
    valueRef.current = newValue;
    setFieldValue(newValue);
    hasBeenEditedRef.current = true;
    
    // For non-critical fields, update parent immediately
    // For critical fields like title/description, use debouncing
    if (field === 'title' || field === 'description') {
      debouncedUpdateParent();
    } else {
      updateParentState();
    }
  }, [field, updateParentState, debouncedUpdateParent]);
  
  // Always update parent state on blur 
  const handleBlur = useCallback(() => {
    // Cancel any pending debounced updates
    updateParentState();
  }, [updateParentState]);
  
  // Memoize the className to prevent unnecessary renders
  const inputClassName = useMemo(() => `tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
    ${
      readOnly
        ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
        : "tw-bg-iron-900 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
    } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`, [readOnly]);
  
  return (
    <TraitWrapper label={label} readOnly={readOnly} className={className}>
      <input
        type="text"
        value={fieldValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        readOnly={readOnly}
        className={inputClassName}
      />
    </TraitWrapper>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  // Only re-render if these specific properties change
  return prevProps.field === nextProps.field &&
         prevProps.label === nextProps.label &&
         prevProps.readOnly === nextProps.readOnly &&
         prevProps.traits[prevProps.field] === nextProps.traits[nextProps.field];
});