import React, { useRef, useEffect, useCallback } from 'react';
import { BooleanTraitProps } from './types';
import { TraitWrapper } from './TraitWrapper';

/**
 * Simplified BooleanTrait component using a ref-based approach
 * Similar to our solution for text and number inputs
 */
export const BooleanTrait: React.FC<BooleanTraitProps> = React.memo(({
  label,
  field,
  traits,
  updateBoolean,
  className,
  error,
  onBlur
}) => {
  // Use a ref to track the current value to avoid React re-render cycles
  const valueRef = useRef<boolean>(Boolean(traits[field]));
  // Use ref for UI state
  const uiStateRef = useRef<HTMLDivElement>(null);
  
  // Update value ref when traits change
  useEffect(() => {
    valueRef.current = Boolean(traits[field]);
    updateUIState();
  }, [traits, field]);
  
  // Direct DOM manipulation to update UI without re-renders
  function updateUIState() {
    if (!uiStateRef.current) return;
    
    const yesButton = uiStateRef.current.querySelector('.yes-button');
    const noButton = uiStateRef.current.querySelector('.no-button');
    
    if (valueRef.current) {
      yesButton?.classList.add('tw-bg-emerald-600/30', 'tw-ring-emerald-500/60', 'tw-text-emerald-200');
      yesButton?.classList.remove('tw-bg-iron-800/50', 'tw-ring-iron-700/50', 'tw-text-iron-400');
      
      noButton?.classList.remove('tw-bg-rose-600/30', 'tw-ring-rose-500/60', 'tw-text-rose-200');
      noButton?.classList.add('tw-bg-iron-800/50', 'tw-ring-iron-700/50', 'tw-text-iron-400');
    } else {
      yesButton?.classList.remove('tw-bg-emerald-600/30', 'tw-ring-emerald-500/60', 'tw-text-emerald-200');
      yesButton?.classList.add('tw-bg-iron-800/50', 'tw-ring-iron-700/50', 'tw-text-iron-400');
      
      noButton?.classList.add('tw-bg-rose-600/30', 'tw-ring-rose-500/60', 'tw-text-rose-200');
      noButton?.classList.remove('tw-bg-iron-800/50', 'tw-ring-iron-700/50', 'tw-text-iron-400');
    }
  }
  
  // Click handlers with direct DOM manipulation
  const handleYesClick = useCallback(() => {
    valueRef.current = true;
    updateBoolean(field, true);
    updateUIState();
    
    // Trigger onBlur if provided (for validation)
    if (onBlur) {
      onBlur(field);
    }
  }, [field, updateBoolean, onBlur]);
  
  const handleNoClick = useCallback(() => {
    valueRef.current = false;
    updateBoolean(field, false);
    updateUIState();
    
    // Trigger onBlur if provided (for validation)
    if (onBlur) {
      onBlur(field);
    }
  }, [field, updateBoolean, onBlur]);
  
  return (
    <TraitWrapper 
      label={label} 
      isBoolean={true} 
      className={className}
      error={error}
      id={`field-${field}`}
    >
      <div 
        ref={uiStateRef} 
        className="tw-flex tw-gap-3 tw-flex-1"
        data-field={field}>
        <button
          onClick={handleYesClick}
          className={`yes-button tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              traits[field]
                ? "tw-bg-emerald-600/30 tw-ring-emerald-500/60 tw-text-emerald-200"
                : "tw-bg-iron-800/50 tw-ring-iron-700/50 tw-text-iron-400"
            } tw-border-0 tw-ring-1 tw-ring-inset hover:tw-brightness-125`}
          type="button"
        >
          Yes
        </button>
        <button
          onClick={handleNoClick}
          className={`no-button tw-flex-1 tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-all tw-shadow-sm
            ${
              !traits[field]
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
}, (prevProps, nextProps) => {
  // Memoization check for performance
  return prevProps.field === nextProps.field &&
         prevProps.label === nextProps.label &&
         prevProps.traits[prevProps.field] === nextProps.traits[nextProps.field] &&
         prevProps.error === nextProps.error;
});

BooleanTrait.displayName = 'BooleanTrait';
