import { 
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError 
} from '@/errors/authentication';

describe('AuthenticationRoleError hierarchy', () => {
  test('AuthenticationRoleError should extend Error', () => {
    const error = new AuthenticationRoleError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AuthenticationRoleError');
    expect(error.message).toBe('Test message');
  });

  test('AuthenticationRoleError should preserve cause', () => {
    const cause = new Error('Original cause');
    const error = new AuthenticationRoleError('Test message', cause);
    expect(error.cause).toBe(cause);
  });

  test('RoleValidationError should extend AuthenticationRoleError', () => {
    const error = new RoleValidationError('expected-role', 'actual-role');
    expect(error).toBeInstanceOf(AuthenticationRoleError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('RoleValidationError');
    expect(error.message).toBe('Role validation failed: expected expected-role, got actual-role');
  });

  test('RoleValidationError should handle null values', () => {
    const error1 = new RoleValidationError(null, 'actual-role');
    expect(error1.message).toBe('Role validation failed: expected null, got actual-role');

    const error2 = new RoleValidationError('expected-role', null);
    expect(error2.message).toBe('Role validation failed: expected expected-role, got null');

    const error3 = new RoleValidationError(null, null);
    expect(error3.message).toBe('Role validation failed: expected null, got null');
  });

  test('RoleValidationError should preserve cause', () => {
    const cause = new Error('Original cause');
    const error = new RoleValidationError('expected', 'actual', cause);
    expect(error.cause).toBe(cause);
  });

  test('MissingActiveProfileError should extend AuthenticationRoleError', () => {
    const error = new MissingActiveProfileError();
    expect(error).toBeInstanceOf(AuthenticationRoleError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('MissingActiveProfileError');
    expect(error.message).toBe('Active profile proxy is required for role-based authentication but is null');
  });
});

describe('Auth role validation scenarios', () => {
  // Mock objects and functions for testing
  const mockActiveProfileProxy = {
    created_by: {
      id: 'valid-role-id'
    }
  };

  const mockInvalidActiveProfileProxy = {
    created_by: {
      id: ''
    }
  };

  const mockNullActiveProfileProxy = null;
  const mockUndefinedActiveProfileProxy = undefined;

  // Helper function to simulate the fixed role validation logic
  function simulateFixedRoleValidation(
    role: string | null,
    freshTokenRole: string | null,
    activeProfileProxy: any
  ) {
    // CRITICAL FIX: FAIL-FAST validation with NO optional chaining
    // The server is the source of truth for roles, not local storage
    if (role && freshTokenRole !== role) {
      // If we specifically requested a role, ensure server provided it
      throw new RoleValidationError(role, freshTokenRole);
    }

    // ADDITIONAL VALIDATION: Ensure role consistency with what was requested
    // FAIL-FAST: NO optional chaining - if activeProfileProxy is null, this MUST fail
    if (activeProfileProxy === null || activeProfileProxy === undefined) {
      // If we're doing role-based authentication but have no active profile proxy,
      // this is a critical state inconsistency that must fail immediately
      throw new MissingActiveProfileError();
    }

    // FAIL-FAST: Direct property access - will throw if structure is invalid
    const requestedRole = activeProfileProxy.created_by.id;

    // Validate that requestedRole is not null/undefined/empty
    if (!requestedRole || typeof requestedRole !== 'string' || requestedRole.trim().length === 0) {
      throw new AuthenticationRoleError(
        'Active profile proxy has invalid created_by.id - role validation cannot proceed'
      );
    }

    // Now perform the role comparison with guaranteed non-null values
    if (freshTokenRole !== requestedRole) {
      throw new RoleValidationError(requestedRole, freshTokenRole);
    }
  }

  test('should throw MissingActiveProfileError when activeProfileProxy is null', () => {
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', mockNullActiveProfileProxy);
    }).toThrow(MissingActiveProfileError);

    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', mockNullActiveProfileProxy);
    }).toThrow('Active profile proxy is required for role-based authentication but is null');
  });

  test('should throw MissingActiveProfileError when activeProfileProxy is undefined', () => {
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', mockUndefinedActiveProfileProxy);
    }).toThrow(MissingActiveProfileError);

    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', mockUndefinedActiveProfileProxy);
    }).toThrow('Active profile proxy is required for role-based authentication but is null');
  });

  test('should throw AuthenticationRoleError when created_by.id is missing', () => {
    const proxyWithoutId = { created_by: {} };
    
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', proxyWithoutId);
    }).toThrow(AuthenticationRoleError);

    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', proxyWithoutId);
    }).toThrow('Active profile proxy has invalid created_by.id - role validation cannot proceed');
  });

  test('should throw AuthenticationRoleError when created_by.id is empty string', () => {
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', mockInvalidActiveProfileProxy);
    }).toThrow(AuthenticationRoleError);

    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', mockInvalidActiveProfileProxy);
    }).toThrow('Active profile proxy has invalid created_by.id - role validation cannot proceed');
  });

  test('should throw AuthenticationRoleError when created_by.id is whitespace', () => {
    const proxyWithWhitespaceId = {
      created_by: {
        id: '   '
      }
    };
    
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', proxyWithWhitespaceId);
    }).toThrow(AuthenticationRoleError);

    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', proxyWithWhitespaceId);
    }).toThrow('Active profile proxy has invalid created_by.id - role validation cannot proceed');
  });

  test('should throw AuthenticationRoleError when created_by.id is not a string', () => {
    const proxyWithNumberId = {
      created_by: {
        id: 123
      }
    };
    
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', proxyWithNumberId);
    }).toThrow(AuthenticationRoleError);

    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', proxyWithNumberId);
    }).toThrow('Active profile proxy has invalid created_by.id - role validation cannot proceed');
  });

  test('should throw RoleValidationError when roles do not match - requested role vs server role', () => {
    expect(() => {
      simulateFixedRoleValidation('requested-role', 'server-role', mockActiveProfileProxy);
    }).toThrow(RoleValidationError);

    expect(() => {
      simulateFixedRoleValidation('requested-role', 'server-role', mockActiveProfileProxy);
    }).toThrow('Role validation failed: expected requested-role, got server-role');
  });

  test('should throw RoleValidationError when roles do not match - profile role vs server role', () => {
    const differentProfileProxy = {
      created_by: {
        id: 'profile-role-id'
      }
    };

    expect(() => {
      simulateFixedRoleValidation(null, 'server-role', differentProfileProxy);
    }).toThrow(RoleValidationError);

    expect(() => {
      simulateFixedRoleValidation(null, 'server-role', differentProfileProxy);
    }).toThrow('Role validation failed: expected profile-role-id, got server-role');
  });

  test('should NOT throw when requested role matches server role and profile role', () => {
    expect(() => {
      simulateFixedRoleValidation('valid-role-id', 'valid-role-id', mockActiveProfileProxy);
    }).not.toThrow();
  });

  test('should NOT throw when no role requested and profile role matches server role', () => {
    expect(() => {
      simulateFixedRoleValidation(null, 'valid-role-id', mockActiveProfileProxy);
    }).not.toThrow();
  });

  test('should handle complex error scenarios - server returns null role', () => {
    expect(() => {
      simulateFixedRoleValidation('valid-role-id', null, mockActiveProfileProxy);
    }).toThrow(RoleValidationError);

    expect(() => {
      simulateFixedRoleValidation('valid-role-id', null, mockActiveProfileProxy);
    }).toThrow('Role validation failed: expected valid-role-id, got null');
  });

  test('should fail fast on structure access - missing created_by', () => {
    const proxyWithoutCreatedBy = {};
    
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', proxyWithoutCreatedBy);
    }).toThrow(); // Should throw when accessing .created_by.id
  });

  test('should validate complete flow integration', () => {
    // Test the complete validation flow with various scenarios
    
    // Scenario 1: All valid
    expect(() => {
      simulateFixedRoleValidation('valid-role-id', 'valid-role-id', mockActiveProfileProxy);
    }).not.toThrow();

    // Scenario 2: Null activeProfileProxy
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', null);
    }).toThrow(MissingActiveProfileError);

    // Scenario 3: Invalid structure
    expect(() => {
      simulateFixedRoleValidation('role-id', 'role-id', { created_by: { id: '' } });
    }).toThrow(AuthenticationRoleError);

    // Scenario 4: Role mismatch
    expect(() => {
      simulateFixedRoleValidation('role-a', 'role-b', mockActiveProfileProxy);
    }).toThrow(RoleValidationError);

    // Scenario 5: Profile role mismatch with server
    const wrongProfileProxy = { created_by: { id: 'wrong-role' } };
    expect(() => {
      simulateFixedRoleValidation(null, 'server-role', wrongProfileProxy);
    }).toThrow(RoleValidationError);
  });
});

describe('Error message format validation', () => {
  test('RoleValidationError message format is consistent', () => {
    const error1 = new RoleValidationError('role-a', 'role-b');
    expect(error1.message).toMatch(/^Role validation failed: expected .*, got .*$/);

    const error2 = new RoleValidationError(null, 'role-b');
    expect(error2.message).toBe('Role validation failed: expected null, got role-b');
  });

  test('MissingActiveProfileError message is specific', () => {
    const error = new MissingActiveProfileError();
    expect(error.message).toBe('Active profile proxy is required for role-based authentication but is null');
  });

  test('AuthenticationRoleError message is preserved', () => {
    const customMessage = 'Custom authentication error message';
    const error = new AuthenticationRoleError(customMessage);
    expect(error.message).toBe(customMessage);
  });
});