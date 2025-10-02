import {
  FieldValidationContext,
  FieldValidationResult,
} from "./validationTypes";
import {
  FieldType,
  NumberFieldDefinition,
  DropdownFieldDefinition,
} from "@/components/waves/memes/traits/schema";

/**
 * Validates a text field
 * @param context The validation context
 * @returns Validation result
 */
function validateTextField(
  context: FieldValidationContext
): FieldValidationResult {
  const { value } = context;

  // Text fields must be non-empty strings
  if (typeof value !== "string") {
    return {
      isValid: false,
      errorMessage: "Value must be a text string",
    };
  }

  if (value.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: "Field cannot be empty",
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Validates a number field
 * @param context The validation context
 * @returns Validation result
 */
function validateNumberField(
  context: FieldValidationContext
): FieldValidationResult {
  const { value, fieldDefinition } = context;

  // Number fields must be actual numbers
  if (typeof value !== "number") {
    return {
      isValid: false,
      errorMessage: "Value must be a number",
    };
  }

  if (isNaN(value)) {
    return {
      isValid: false,
      errorMessage: "Value must be a valid number",
    };
  }

  // Disallow zero values
  if (value === 0) {
    return {
      isValid: false,
      errorMessage: "Value cannot be zero",
    };
  }

  // Check min/max constraints if defined in the field definition
  const numberFieldDef = fieldDefinition as NumberFieldDefinition;

  if (numberFieldDef.min !== undefined && value < numberFieldDef.min) {
    return {
      isValid: false,
      errorMessage: `Value must be at least ${numberFieldDef.min}`,
    };
  }

  if (numberFieldDef.max !== undefined && value > numberFieldDef.max) {
    return {
      isValid: false,
      errorMessage: `Value must be at most ${numberFieldDef.max}`,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Validates a boolean field
 * @param context The validation context
 * @returns Validation result
 */
function validateBooleanField(
  context: FieldValidationContext
): FieldValidationResult {
  const { value } = context;

  // Boolean fields must be true or false
  if (typeof value !== "boolean") {
    return {
      isValid: false,
      errorMessage: "Value must be a boolean",
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Validates a dropdown field
 * @param context The validation context
 * @returns Validation result
 */
function validateDropdownField(
  context: FieldValidationContext
): FieldValidationResult {
  const { value, fieldDefinition } = context;

  // Dropdown fields must be strings
  if (typeof value !== "string") {
    return {
      isValid: false,
      errorMessage: "Value must be a text selection",
    };
  }

  if (value.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: "Please select an option",
    };
  }

  // Check if the value is in the options list
  const dropdownFieldDef = fieldDefinition as DropdownFieldDefinition;
  if (!dropdownFieldDef.options.includes(value)) {
    return {
      isValid: false,
      errorMessage: "Selected value is not a valid option",
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Maps field types to their validation functions
 */
export const validationRulesByType = {
  [FieldType.TEXT]: validateTextField,
  [FieldType.NUMBER]: validateNumberField,
  [FieldType.BOOLEAN]: validateBooleanField,
  [FieldType.DROPDOWN]: validateDropdownField,
};
