import { validationRulesByType } from '@/components/waves/memes/submission/validation/validationRules';
import { FieldType } from '@/components/waves/memes/traits/schema';
import {
  FieldValidationContext,
  FieldValidationResult,
} from '@/components/waves/memes/submission/validation/validationTypes';

describe('validationRules', () => {
  describe('validateTextField', () => {
    const validateTextField = validationRulesByType[FieldType.TEXT];

    it('should validate non-empty string as valid', () => {
      const context: FieldValidationContext = {
        field: 'title',
        value: 'Valid Title',
        fieldDefinition: { type: FieldType.TEXT },
        formData: { title: 'Valid Title' } as any,
      };

      const result: FieldValidationResult = validateTextField(context);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should reject non-string values', () => {
      const context: FieldValidationContext = {
        field: 'title',
        value: 123 as any,
        fieldDefinition: { type: FieldType.TEXT },
        formData: { title: 123 } as any,
      };

      const result: FieldValidationResult = validateTextField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be a text string');
    });

    it('should reject empty strings', () => {
      const context: FieldValidationContext = {
        field: 'title',
        value: '',
        fieldDefinition: { type: FieldType.TEXT },
        formData: { title: '' } as any,
      };

      const result: FieldValidationResult = validateTextField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Field cannot be empty');
    });

    it('should reject whitespace-only strings', () => {
      const context: FieldValidationContext = {
        field: 'title',
        value: '   ',
        fieldDefinition: { type: FieldType.TEXT },
        formData: { title: '   ' } as any,
      };

      const result: FieldValidationResult = validateTextField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Field cannot be empty');
    });
  });

  describe('validateNumberField', () => {
    const validateNumberField = validationRulesByType[FieldType.NUMBER];

    it('should validate valid positive number', () => {
      const context: FieldValidationContext = {
        field: 'mints' as any,
        value: 5,
        fieldDefinition: { type: FieldType.NUMBER },
        formData: { mints: 5 } as any,
      };

      const result: FieldValidationResult = validateNumberField(context);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should validate valid negative number', () => {
      const context: FieldValidationContext = {
        field: 'mints' as any,
        value: -5,
        fieldDefinition: { type: FieldType.NUMBER },
        formData: { mints: -5 } as any,
      };

      const result: FieldValidationResult = validateNumberField(context);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should reject non-number values', () => {
      const context: FieldValidationContext = {
        field: 'mints' as any,
        value: 'not a number' as any,
        fieldDefinition: { type: FieldType.NUMBER },
        formData: { mints: 'not a number' } as any,
      };

      const result: FieldValidationResult = validateNumberField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be a number');
    });

    it('should reject NaN values', () => {
      const context: FieldValidationContext = {
        field: 'mints' as any,
        value: NaN,
        fieldDefinition: { type: FieldType.NUMBER },
        formData: { mints: NaN } as any,
      };

      const result: FieldValidationResult = validateNumberField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be a valid number');
    });

    it('should reject zero values', () => {
      const context: FieldValidationContext = {
        field: 'mints' as any,
        value: 0,
        fieldDefinition: { type: FieldType.NUMBER },
        formData: { mints: 0 } as any,
      };

      const result: FieldValidationResult = validateNumberField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value cannot be zero');
    });

    it('should validate number within min/max constraints', () => {
      const context: FieldValidationContext = {
        field: 'mints' as any,
        value: 5,
        fieldDefinition: { type: FieldType.NUMBER, min: 1, max: 10 },
        formData: { mints: 5 } as any,
      };

      const result: FieldValidationResult = validateNumberField(context);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should reject number below minimum', () => {
      const context: FieldValidationContext = {
        field: 'mints' as any,
        value: 1,
        fieldDefinition: { type: FieldType.NUMBER, min: 5, max: 10 },
        formData: { mints: 1 } as any,
      };

      const result: FieldValidationResult = validateNumberField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be at least 5');
    });

    it('should reject number above maximum', () => {
      const context: FieldValidationContext = {
        field: 'mints' as any,
        value: 15,
        fieldDefinition: { type: FieldType.NUMBER, min: 1, max: 10 },
        formData: { mints: 15 } as any,
      };

      const result: FieldValidationResult = validateNumberField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be at most 10');
    });
  });

  describe('validateBooleanField', () => {
    const validateBooleanField = validationRulesByType[FieldType.BOOLEAN];

    it('should validate true as valid', () => {
      const context: FieldValidationContext = {
        field: 'gradient',
        value: true,
        fieldDefinition: { type: FieldType.BOOLEAN },
        formData: { gradient: true } as any,
      };

      const result: FieldValidationResult = validateBooleanField(context);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should validate false as valid', () => {
      const context: FieldValidationContext = {
        field: 'gradient',
        value: false,
        fieldDefinition: { type: FieldType.BOOLEAN },
        formData: { gradient: false } as any,
      };

      const result: FieldValidationResult = validateBooleanField(context);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should reject non-boolean values', () => {
      const context: FieldValidationContext = {
        field: 'gradient',
        value: 'true' as any,
        fieldDefinition: { type: FieldType.BOOLEAN },
        formData: { gradient: 'true' } as any,
      };

      const result: FieldValidationResult = validateBooleanField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be a boolean');
    });
  });

  describe('validateDropdownField', () => {
    const validateDropdownField = validationRulesByType[FieldType.DROPDOWN];

    it('should validate valid option', () => {
      const context: FieldValidationContext = {
        field: 'style',
        value: 'option1',
        fieldDefinition: { 
          type: FieldType.DROPDOWN, 
          options: ['option1', 'option2', 'option3'] 
        },
        formData: { style: 'option1' } as any,
      };

      const result: FieldValidationResult = validateDropdownField(context);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should reject non-string values', () => {
      const context: FieldValidationContext = {
        field: 'style',
        value: 123 as any,
        fieldDefinition: { 
          type: FieldType.DROPDOWN, 
          options: ['option1', 'option2', 'option3'] 
        },
        formData: { style: 123 } as any,
      };

      const result: FieldValidationResult = validateDropdownField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be a text selection');
    });

    it('should reject empty strings', () => {
      const context: FieldValidationContext = {
        field: 'style',
        value: '',
        fieldDefinition: { 
          type: FieldType.DROPDOWN, 
          options: ['option1', 'option2', 'option3'] 
        },
        formData: { style: '' } as any,
      };

      const result: FieldValidationResult = validateDropdownField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Please select an option');
    });

    it('should reject invalid options', () => {
      const context: FieldValidationContext = {
        field: 'style',
        value: 'invalid_option',
        fieldDefinition: { 
          type: FieldType.DROPDOWN, 
          options: ['option1', 'option2', 'option3'] 
        },
        formData: { style: 'invalid_option' } as any,
      };

      const result: FieldValidationResult = validateDropdownField(context);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Selected value is not a valid option');
    });
  });

  describe('validationRulesByType', () => {
    it('should have validation functions for all field types', () => {
      expect(validationRulesByType[FieldType.TEXT]).toBeDefined();
      expect(validationRulesByType[FieldType.NUMBER]).toBeDefined();
      expect(validationRulesByType[FieldType.BOOLEAN]).toBeDefined();
      expect(validationRulesByType[FieldType.DROPDOWN]).toBeDefined();
    });

    it('should have validation functions that return results', () => {
      const textValidator = validationRulesByType[FieldType.TEXT];
      const context: FieldValidationContext = {
        field: 'title',
        value: 'test',
        fieldDefinition: { type: FieldType.TEXT },
        formData: { title: 'test' } as any,
      };

      const result = textValidator(context);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errorMessage');
    });
  });
});