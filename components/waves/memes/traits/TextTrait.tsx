import React, { useRef, useCallback, useMemo } from 'react';
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
  const inputClassName = useMemo(() => `tw-form-input tw-w-2/3 tw-rounded-lg tw-px-3 tw-py-3 tw-text-sm tw-text-iron-100 tw-transition-all tw-shadow-inner
    ${
      readOnly
        ? "tw-bg-iron-950 tw-ring-iron-950 tw-opacity-80 tw-cursor-not-allowed tw-text-iron-500"
        : "tw-bg-iron-900 tw-ring-iron-700/60 tw-cursor-text hover:tw-ring-primary-400 focus:tw-ring-primary-400"
    } tw-ring-1 tw-ring-inset tw-border-0 placeholder:tw-text-iron-500`, [readOnly]);
  
  return (
    <TraitWrapper label={label} readOnly={readOnly} className={className} error={error}>
      <input
        ref={inputRef}
        type="text"
        defaultValue={(traits[field] as string) || ''}
        onBlur={handleBlur}
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
