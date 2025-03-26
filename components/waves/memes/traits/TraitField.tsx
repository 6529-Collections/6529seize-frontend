import React, { memo } from 'react';
import { TextTrait } from './TextTrait';
import { NumberTrait } from './NumberTrait';
import { DropdownTrait } from './DropdownTrait';
import { BooleanTrait } from './BooleanTrait';
import { FieldDefinition, FieldType } from './schema';
import { TraitsData } from '../submission/types/TraitsData';

interface TraitFieldProps {
  readonly definition: FieldDefinition;
  readonly traits: TraitsData;
  readonly updateText: (field: keyof TraitsData, value: string) => void;
  readonly updateNumber: (field: keyof TraitsData, value: number) => void;
  readonly updateBoolean: (field: keyof TraitsData, value: boolean) => void;
  readonly error?: string | null;
  readonly onBlur?: () => void;
}

// Create the component
const TraitFieldComponent: React.FC<TraitFieldProps> = ({
  definition,
  traits,
  updateText,
  updateNumber,
  updateBoolean,
  error,
  onBlur,
}) => {
  // Text field rendering
  if (definition.type === FieldType.TEXT) {
    // TypeScript automatically narrows the type here
    return (
      <TextTrait
        label={definition.label}
        field={definition.field}
        traits={traits}
        updateText={updateText}
        readOnly={definition.readOnly}
        placeholder={definition.placeholder}
        error={error}
        onBlur={onBlur}
      />
    );
  }
  
  // Number field rendering
  if (definition.type === FieldType.NUMBER) {
    // TypeScript automatically narrows the type here
    return (
      <NumberTrait
        label={definition.label}
        field={definition.field}
        traits={traits}
        updateNumber={updateNumber}
        readOnly={definition.readOnly}
        min={definition.min}
        max={definition.max}
        error={error}
        onBlur={onBlur}
      />
    );
  }
  
  // Dropdown field rendering
  if (definition.type === FieldType.DROPDOWN) {
    // TypeScript automatically narrows the type here
    return (
      <DropdownTrait
        label={definition.label}
        field={definition.field}
        traits={traits}
        updateText={updateText}
        options={definition.options}
        error={error}
        onBlur={onBlur}
      />
    );
  }
  
  // Boolean field rendering
  if (definition.type === FieldType.BOOLEAN) {
    // TypeScript automatically narrows the type here
    return (
      <BooleanTrait
        label={definition.label}
        field={definition.field}
        traits={traits}
        updateBoolean={updateBoolean}
        error={error}
        onBlur={onBlur}
      />
    );
  }
  
  // Exhaustiveness check - TypeScript will warn if we missed any type
  const _exhaustiveCheck: never = definition;
  return null;
};

// Create comparison function for memoization
const arePropsEqual = (prevProps: TraitFieldProps, nextProps: TraitFieldProps) => {
  const { definition, traits, error } = prevProps;
  const { definition: nextDefinition, traits: nextTraits, error: nextError } = nextProps;
  
  // Check if field value has changed
  const fieldMatches = traits[definition.field] === nextTraits[nextDefinition.field];
  
  // For title/description fields, we want to re-render even if they seem the same
  // This ensures that stale text doesn't persist in the UI
  if (definition.field === 'title' || definition.field === 'description') {
    return false; // Always re-render title/description fields
  }
  
  // Check if definition changed
  const definitionMatches = 
    definition.type === nextDefinition.type && 
    definition.field === nextDefinition.field &&
    definition.label === nextDefinition.label;
  
  // Check if validation error changed
  const errorMatches = error === nextError;
  
  // Special handling for dropdown fields - re-render more aggressively
  if (definition.type === FieldType.DROPDOWN) {
    // Check if any important title/description changed that might affect dropdown behavior
    if (traits.title !== nextTraits.title || traits.description !== nextTraits.description) {
      return false; // Re-render if title/description changed
    }
  }
  
  // Return true if nothing relevant changed (prevent re-render)
  return fieldMatches && definitionMatches && errorMatches;
};

// Export memoized component with display name
export const TraitField = memo(TraitFieldComponent, arePropsEqual);
TraitField.displayName = 'TraitField';
