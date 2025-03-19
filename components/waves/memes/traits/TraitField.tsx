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
}

// Create the component
const TraitFieldComponent: React.FC<TraitFieldProps> = ({
  definition,
  traits,
  updateText,
  updateNumber,
  updateBoolean,
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
      />
    );
  }
  
  // Exhaustiveness check - TypeScript will warn if we missed any type
  const _exhaustiveCheck: never = definition;
  return null;
};

// Create comparison function for memoization
const arePropsEqual = (prevProps: TraitFieldProps, nextProps: TraitFieldProps) => {
  const { definition, traits } = prevProps;
  const { definition: nextDefinition, traits: nextTraits } = nextProps;
  
  // Check if field value has changed
  const fieldMatches = traits[definition.field] === nextTraits[nextDefinition.field];
  
  // Check if definition changed
  const definitionMatches = 
    definition.type === nextDefinition.type && 
    definition.field === nextDefinition.field &&
    definition.label === nextDefinition.label;
    
  // Return true if nothing changed (prevent re-render)
  return fieldMatches && definitionMatches;
};

// Export memoized component with display name
export const TraitField = memo(TraitFieldComponent, arePropsEqual);
TraitField.displayName = 'TraitField';