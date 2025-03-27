import { TraitsData } from "../types/TraitsData";
import { traitDefinitions, FieldDefinition } from "../../traits/schema";
import {
  ValidationOptions,
  ValidationResult,
  FieldValidationContext,
} from "./validationTypes";
import { validationRulesByType } from "./validationRules";

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: ValidationOptions = {
  mode: "all",
  touchedFields: new Set<keyof TraitsData>(),
};

/**
 * Validates all traits data based on the schema definitions
 * @param traits Current traits data to validate
 * @param options Validation options
 * @returns Complete validation result
 */
export function validateTraitsData(
  traits: TraitsData,
  options: ValidationOptions = DEFAULT_OPTIONS
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: {} as Record<keyof TraitsData, string | null>,
    errorCount: 0,
  };

  // Get all field definitions from trait sections
  const allFields = getAllFieldDefinitions();

  // Initialize all error fields to null (valid)
  (Object.keys(traits) as Array<keyof TraitsData>).forEach((field) => {
    result.errors[field] = null;
  });

  // Validate required fields
  const requiredFieldErrors = validateRequiredFields(
    traits,
    allFields,
    options
  );

  // Track if we've found any errors
  let foundError = false;

  // Process errors for each field
  for (const [field, error] of Object.entries(requiredFieldErrors)) {
    const typedField = field as keyof TraitsData;

    if (error) {
      // Store first invalid field for focusing
      if (!foundError) {
        result.firstInvalidField = typedField;
        foundError = true;
      }

      result.errors[typedField] = error;
      result.errorCount++;
      result.isValid = false;
    }
  }

  return result;
}

/**
 * Gets all field definitions from the schema
 * @returns Record of field names to their definitions
 */
function getAllFieldDefinitions(): Record<string, FieldDefinition> {
  const fieldDefs: Record<string, FieldDefinition> = {};

  // Flatten all section definitions into a single record of field definitions
  traitDefinitions.forEach((section) => {
    section.fields.forEach((field) => {
      fieldDefs[field.field] = field;
    });
  });

  return fieldDefs;
}

/**
 * Validates that all required fields have values
 * @param traits Current traits data
 * @param fieldDefinitions Schema definitions for fields
 * @param options Validation options
 * @returns Record of field names to error messages
 */
function validateRequiredFields(
  traits: TraitsData,
  fieldDefinitions: Record<string, FieldDefinition>,
  options: ValidationOptions
): Record<string, string | null> {
  const errors: Record<string, string | null> = {};

  // Check each field in the traits data
  for (const [field, fieldDef] of Object.entries(fieldDefinitions)) {
    const typedField = field as keyof TraitsData;

    // Skip fields not included in the validation mode
    if (shouldSkipFieldValidation(typedField, options, traits)) {
      continue;
    }

    // Only validate if the field has a definition
    if (fieldDef) {
      const value = traits[typedField];

      // Create validation context for the field
      const context: FieldValidationContext = {
        field: typedField,
        value,
        fieldDefinition: fieldDef,
        formData: traits,
      };

      // Get validator function for the field type
      const validator = validationRulesByType[fieldDef.type];

      if (validator) {
        // Execute validation
        const validationResult = validator(context);
        errors[field] = validationResult.errorMessage;
      }
    }
  }

  // Special case for title and description which are critical fields,
  // but still respect the validation mode
  if (
    options.mode === "all" ||
    (options.touchedFields && options.touchedFields.has("title"))
  ) {
    if (!traits.title || traits.title.trim() === "") {
      errors.title = "Title is required";
    }
  }

  if (
    options.mode === "all" ||
    (options.touchedFields && options.touchedFields.has("description"))
  ) {
    if (!traits.description || traits.description.trim() === "") {
      errors.description = "Description is required";
    }
  }

  return errors;
}

/**
 * Determines if a field should be skipped based on validation options
 * @param field Field name
 * @param options Validation options
 * @param traits Current form data
 * @returns True if validation should be skipped
 */
function shouldSkipFieldValidation(
  field: keyof TraitsData,
  options: ValidationOptions,
  traits: TraitsData
): boolean {
  // In 'all' mode, validate every field
  if (options.mode === "all") {
    return false;
  }

  // In 'touched' mode, only validate fields the user has interacted with
  if (options.mode === "touched" && options.touchedFields) {
    return !options.touchedFields.has(field);
  }

  // In 'dirty' mode, only validate fields that have changed from initial value
  if (options.mode === "dirty" && options.initialValues) {
    const initialValue = options.initialValues[field];
    const currentValue = traits[field]; // Compare with current traits value

    // Skip validation if value hasn't changed from initial
    return initialValue === currentValue;
  }

  return false;
}
