/**
 * Test suite for role validation functionality in authentication system
 * These tests verify the fail-fast behavior of the validateRoleForAuthentication function
 * and ensure authentication vulnerabilities are properly addressed
 */

import { validateRoleForAuthentication } from '@/utils/role-validation';
import { 
  MissingActiveProfileError, 
  InvalidRoleStateError 
} from '@/errors/authentication';
import type { ApiProfileProxy } from '@/generated/models/ApiProfileProxy';

// Mock logger to prevent console output during tests
jest.mock('@/utils/error-sanitizer', () => ({
  logErrorSecurely: jest.fn(),
  sanitizeErrorForUser: jest.fn((error) => error.message || 'Unknown error')
}));

describe('validateRoleForAuthentication', () => {
  describe('FAIL-FAST behavior - null/undefined activeProfileProxy', () => {
    it('throws MissingActiveProfileError when activeProfileProxy is null', () => {
      expect(() => {
        validateRoleForAuthentication(null);
      }).toThrow(MissingActiveProfileError);
      
      expect(() => {
        validateRoleForAuthentication(null);
      }).toThrow('Active profile proxy is required for role-based authentication but is null');
    });

    it('throws MissingActiveProfileError when activeProfileProxy is undefined', () => {
      expect(() => {
        validateRoleForAuthentication(undefined as any);
      }).toThrow(MissingActiveProfileError);
    });
  });

  describe('FAIL-FAST behavior - invalid role structure', () => {
    it('throws when created_by is null', () => {
      const invalidProxy = {
        created_by: null
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow();
    });

    it('throws when created_by is undefined', () => {
      const invalidProxy = {
        created_by: undefined
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow();
    });

    it('throws when created_by.id is missing', () => {
      const invalidProxy = {
        created_by: {}
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow();
    });
  });

  describe('FAIL-FAST behavior - invalid role ID values', () => {
    it('throws InvalidRoleStateError when role ID is null', () => {
      const invalidProxy = {
        created_by: {
          id: null
        }
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow(InvalidRoleStateError);
      
      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow("Active profile proxy has invalid created_by.id: 'null'");
    });

    it('throws InvalidRoleStateError when role ID is undefined', () => {
      const invalidProxy = {
        created_by: {
          id: undefined
        }
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow(InvalidRoleStateError);
    });

    it('throws InvalidRoleStateError when role ID is empty string', () => {
      const invalidProxy = {
        created_by: {
          id: ''
        }
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow(InvalidRoleStateError);
      
      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow("Active profile proxy has invalid created_by.id: ''");
    });

    it('throws InvalidRoleStateError when role ID is whitespace only', () => {
      const invalidProxy = {
        created_by: {
          id: '   '
        }
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow(InvalidRoleStateError);
    });

    it('throws InvalidRoleStateError when role ID is not a string', () => {
      const invalidProxy = {
        created_by: {
          id: 123
        }
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow(InvalidRoleStateError);
      
      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow("Active profile proxy has invalid created_by.id: '123' (type: number)");
    });

    it('throws InvalidRoleStateError when role ID is boolean', () => {
      const invalidProxy = {
        created_by: {
          id: false
        }
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow(InvalidRoleStateError);
    });

    it('throws InvalidRoleStateError when role ID is an object', () => {
      const invalidProxy = {
        created_by: {
          id: { someProperty: 'value' }
        }
      } as any as ApiProfileProxy;

      expect(() => {
        validateRoleForAuthentication(invalidProxy);
      }).toThrow(InvalidRoleStateError);
    });
  });

  describe('SUCCESS cases - valid role validation', () => {
    it('returns valid role ID when structure is correct', () => {
      const validProxy = {
        created_by: {
          id: 'valid-role-id-123'
        }
      } as any as ApiProfileProxy;

      const result = validateRoleForAuthentication(validProxy);
      expect(result).toBe('valid-role-id-123');
    });

    it('returns valid role ID when role contains special characters', () => {
      const validProxy = {
        created_by: {
          id: 'role-with-special-chars!@#$%^&*()'
        }
      } as any as ApiProfileProxy;

      const result = validateRoleForAuthentication(validProxy);
      expect(result).toBe('role-with-special-chars!@#$%^&*()');
    });

    it('returns valid role ID when role is a UUID', () => {
      const validProxy = {
        created_by: {
          id: '550e8400-e29b-41d4-a716-446655440000'
        }
      } as any as ApiProfileProxy;

      const result = validateRoleForAuthentication(validProxy);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('returns valid role ID when role contains numbers', () => {
      const validProxy = {
        created_by: {
          id: 'user123456789'
        }
      } as any as ApiProfileProxy;

      const result = validateRoleForAuthentication(validProxy);
      expect(result).toBe('user123456789');
    });
  });

  describe('Error types and inheritance', () => {
    it('MissingActiveProfileError has correct name and inheritance', () => {
      try {
        validateRoleForAuthentication(null);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(MissingActiveProfileError);
        expect(error.name).toBe('MissingActiveProfileError');
      }
    });

    it('InvalidRoleStateError has correct name and inheritance', () => {
      const invalidProxy = {
        created_by: {
          id: null
        }
      } as any as ApiProfileProxy;

      try {
        validateRoleForAuthentication(invalidProxy);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(InvalidRoleStateError);
        expect(error.name).toBe('InvalidRoleStateError');
      }
    });
  });

  describe('Edge cases and security considerations', () => {
    it('does not accept falsy values that could bypass authentication', () => {
      const testCases = [
        { created_by: { id: 0 } },
        { created_by: { id: false } },
        { created_by: { id: NaN } },
        { created_by: { id: [] } },
        { created_by: { id: {} } }
      ];

      testCases.forEach((testCase, index) => {
        expect(() => {
          validateRoleForAuthentication(testCase as any);
        }).toThrow(InvalidRoleStateError);
      });
    });

    it('handles malformed proxy objects gracefully', () => {
      const malformedCases = [
        {},
        { created_by: null },
        { created_by: undefined },
        { created_by: 'string' },
        { created_by: 123 },
        { something_else: 'value' }
      ];

      malformedCases.forEach((testCase) => {
        expect(() => {
          validateRoleForAuthentication(testCase as any);
        }).toThrow(); // Should throw some error, not return a value
      });
    });
  });

  describe('Performance and reliability', () => {
    it('consistently throws the same error type for the same invalid input', () => {
      const invalidProxy = {
        created_by: {
          id: ''
        }
      } as any as ApiProfileProxy;

      for (let i = 0; i < 100; i++) {
        expect(() => {
          validateRoleForAuthentication(invalidProxy);
        }).toThrow(InvalidRoleStateError);
      }
    });

    it('consistently returns the same result for valid input', () => {
      const validProxy = {
        created_by: {
          id: 'consistent-role-id'
        }
      } as any as ApiProfileProxy;

      for (let i = 0; i < 100; i++) {
        const result = validateRoleForAuthentication(validProxy);
        expect(result).toBe('consistent-role-id');
      }
    });
  });
});