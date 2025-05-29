import React, { useRef, useCallback, useMemo } from 'react';
import { useDebounce } from 'react-use';
import { TextTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

/**
 * Extremely simplified TextTrait component using uncontrolled inputs
 * This approach eliminates React render cycles during typing for maximum performance
 */
export const TextTrait: React.FC<TextTraitProps> = React.memo(({
  label,
  field,
  traits,
  updateText,
  readOnly = false,
  placeholder,
  className,
  error,
  onBlur,
}) => {
  // Use a ref to track the input element
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounced update function - stores the current input value for use in the debounced function
  const [debouncedValue, setDebouncedValue] = React.useState<string>('');
  
  // Update traits when debounced value changes
  useDebounce(
    () => {
      if (debouncedValue !== '' && debouncedValue !== traits[field]) {
        updateText(field, debouncedValue);
      }
    },
    400, // 400ms is a good balance for typing pauses
    [debouncedValue]
  );
  
  // Handle input changes with debounce
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDebouncedValue(e.target.value);
  }, []);
  
  // Handle blur (when user finishes typing)
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (inputRef.current && inputRef.current.value !== traits[field]) {
      updateText(field, inputRef.current.value);
    }
    // Call parent onBlur if provided
    if (onBlur) {
      onBlur(field);
    }
  }, [field, traits, updateText, onBlur]);
  
  // Synchronize the input value with props when traits change from outside
  React.useEffect(() => {
    const value = (traits[field] as string) || '';
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [traits, field]);
  
  // Prepare input className
  const inputClassName = useMemo(() => `tw-form-input tw-font-normal tw-w-full tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-transition-all tw-duration-500 tw-ease-in-out tw-border-0 tw-outline-none placeholder:tw-text-iron-500 tw-ring-1
    ${
      readOnly
        ? "tw-bg-iron-700 tw-opacity-70 tw-cursor-not-allowed tw-text-iron-300"
        : error
          ? "tw-bg-iron-900 tw-ring-red tw-cursor-text"
          : "tw-bg-iron-900 tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-650 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 tw-cursor-text"
    }
    
    
    `, [readOnly, error]);
  
  return (
    <TraitWrapper label={label} readOnly={readOnly} className={className} error={error}>
      <input
        ref={inputRef}
        type="text"
        defaultValue={(traits[field] as string) || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={500}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        readOnly={readOnly}
        className={inputClassName}
      />
    </TraitWrapper>
  );
}, (prevProps, nextProps) => {
  return prevProps.field === nextProps.field &&
         prevProps.label === nextProps.label &&
         prevProps.readOnly === nextProps.readOnly &&
         prevProps.traits[prevProps.field] === nextProps.traits[nextProps.field] &&
         prevProps.error === nextProps.error;
});

TextTrait.displayName = 'TextTrait';
