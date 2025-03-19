import React from 'react';
import { TraitFieldProps } from './types';
import { TextTrait } from './TextTrait';
import { NumberTrait } from './NumberTrait';
import { DropdownTrait } from './DropdownTrait';
import { BooleanTrait } from './BooleanTrait';

export const TraitField: React.FC<TraitFieldProps> = ({
  definition,
  traits,
  updateText,
  updateNumber,
  updateBoolean,
}) => {
  // Text field rendering
  if (definition.type === 'text') {
    // TypeScript now knows definition is TextFieldDefinition
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
  if (definition.type === 'number') {
    // TypeScript now knows definition is NumberFieldDefinition
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
  if (definition.type === 'dropdown') {
    // TypeScript now knows definition is DropdownFieldDefinition
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
  if (definition.type === 'boolean') {
    // TypeScript now knows definition is BooleanFieldDefinition
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