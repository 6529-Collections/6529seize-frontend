import React, { useRef, useCallback } from 'react';
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
  // Use a ref to track the latest value independently of render cycles
  const valueRef = useRef<string>((traits[field] as string) || '');
  
  // Controlled component state - initializes from props but then manages locally
  const [fieldValue, setFieldValue] = React.useState<string>((traits[field] as string) || '');
  
  // Track if the field has been edited by the user
  const hasBeenEditedRef = useRef<boolean>(false);
  
  // Memoized update function that won't change on rerenders
  const updateParentState = useCallback(() => {
    if (hasBeenEditedRef.current) {
      console.log(`TextTrait ${field} updating parent state with:`, valueRef.current);
      updateText(field, valueRef.current);
    }
  }, [field, updateText]);
  
  // Only update from props if we haven't been edited AND the prop value changed
  React.useEffect(() => {
    const propValue = (traits[field] as string) || '';
    
    // If this field is title/description and has been edited, don't override
    if ((field === 'title' || field === 'description') && hasBeenEditedRef.current) {
      console.log(`TextTrait ${field}: Keeping edited value:`, valueRef.current, 'instead of prop value:', propValue);
      return;
    }
    
    // Only update if different
    if (propValue !== valueRef.current) {
      console.log(`TextTrait ${field} updating from props:`, propValue);
      valueRef.current = propValue;
      setFieldValue(propValue);
    }
  }, [traits, field]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log(`TextTrait ${field} input changed to:`, newValue);
    
    // Update both our ref and state
    valueRef.current = newValue;
    setFieldValue(newValue);
    hasBeenEditedRef.current = true;
    
    // For non-critical fields, update parent immediately
    if (field !== 'title' && field !== 'description') {
      updateParentState();
    }
  };
  
  // Always update parent state on blur for title/description
  const handleBlur = () => {
    updateParentState();
  };
  
  return (
    <TraitWrapper label={label} readOnly={readOnly} className={className}>
      <input
        type="text"
        value={fieldValue}
        onChange={handleChange}
        onBlur={handleBlur}
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